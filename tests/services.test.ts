// services/ (ไฟล์เดียวกับ gear-up-api) บน D1: ส่ง db เข้าไปตรง ๆ ไม่ผ่าน HTTP
// สามข้อแรกยกมาจาก tests/services.test.ts ของ gear-up-api ข้อที่เหลือเป็นเรื่องที่ D1 ทำต่างจาก Postgres
import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"
import { cancelByGuest, lookupBooking } from "../src/services/guest-booking.ts"
import { createBooking, type NewBooking } from "../src/services/create-booking.ts"
import { ServiceError } from "../src/services/errors.ts"
import { moveBooking } from "../src/services/move-booking.ts"
import { getSlots } from "../src/services/slots.ts"
import { freshDb, newGuest, NOW } from "./helpers.ts"

const now = new Date(NOW)
const guest = (n: number, slot: string): NewBooking => ({
  ...newGuest,
  slot,
  carSize: "small",
  phone: `089-000-00${String(n).padStart(2, "0")}`,
  plate: `9กก-00${String(n).padStart(2, "0")}`,
})

describe("services on D1", () => {
  it("getSlots matches the data sheet", async () => {
    const db = await freshDb()
    const { slots } = await getSlots(db, "2026-11-17")
    expect(slots.map((s) => [s.time, s.left, s.message])).toEqual([
      ["09:00", 1, "เหลือช่องสุดท้าย"],
      ["11:00", 0, "เต็มแล้ว"],
      ["13:00", 3, "เหลือ 3 ช่อง"],
      ["15:00", 2, "เหลือ 2 ช่อง"],
    ])
  })

  it("throws a conflict ServiceError when the slot is full", async () => {
    const db = await freshDb()
    const attempt = createBooking(db, guest(1, "11:00"), now)
    await expect(attempt).rejects.toBeInstanceOf(ServiceError)
    await expect(attempt).rejects.toMatchObject({ kind: "conflict", message: "รอบนี้เต็มแล้ว" })
  })

  it("two customers racing for the last bay: one gets it, the other gets 'full'", async () => {
    const db = await freshDb()
    // 09:00 เหลือช่องสุดท้าย ส่งสองคำขอพร้อมกัน บน D1 ตัวกันคือ INSERT ... WHERE คำสั่งเดียว
    const results = await Promise.allSettled([
      createBooking(db, guest(1, "09:00"), now),
      createBooking(db, guest(2, "09:00"), now),
    ])
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    const failed = results.find((r) => r.status === "rejected")
    expect(failed?.reason).toMatchObject({ kind: "conflict", message: "รอบนี้เต็มแล้ว" })
    const { slots } = await getSlots(db, "2026-11-17")
    expect(slots[0]).toMatchObject({ time: "09:00", left: 0 })
  })

  it("five customers racing for the three bays of 13:00: exactly three get in", async () => {
    const db = await freshDb()
    const results = await Promise.allSettled([1, 2, 3, 4, 5].map((n) => createBooking(db, guest(n, "13:00"), now)))
    const ok = results.filter((r) => r.status === "fulfilled")
    expect(ok).toHaveLength(3)
    // id ใหม่ไม่ซ้ำกัน (MAX + 1 อยู่ในคำสั่งเดียวกับ INSERT)
    const ids = ok.map((r) => (r as PromiseFulfilledResult<{ id: string }>).value.id).sort()
    expect(ids).toEqual(["B212", "B213", "B214"])
    const { slots } = await getSlots(db, "2026-11-17")
    expect(slots[2]).toMatchObject({ time: "13:00", left: 0 })
  })

  it("the same car racing for one slot twice: one booking, the other 'same car'", async () => {
    const db = await freshDb()
    const results = await Promise.allSettled([createBooking(db, guest(7, "13:00"), now), createBooking(db, guest(7, "13:00"), now)])
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    expect(results.find((r) => r.status === "rejected")?.reason).toMatchObject({ message: "รถคันนี้จองรอบนี้ไว้แล้ว" })
  })

  it("a new guest gets the next customer id and the price is stored at booking time", async () => {
    const db = await freshDb()
    const booked = await createBooking(db, { ...newGuest, carSize: "big" }, now)
    expect(booked).toMatchObject({ id: "B212", price: 1600, mechanic: "", mechanicId: null, status: "booked" })
    expect(booked.code).toMatch(/^GU-[A-Z0-9]{4}$/)
    const rows = await env.DB.prepare("SELECT customer_id FROM cars WHERE plate = ?").bind(newGuest.plate).first()
    expect(rows).toEqual({ customer_id: "C18" })
  })

  it("the cancelled B209 doesn't block คุณเปิ้ล's Triton from 13:00 (partial unique index)", async () => {
    const db = await freshDb()
    const triton = { ...newGuest, customer: "คุณเปิ้ล", phone: "081-234-1009", car: "Mitsubishi Triton", plate: "9ซญ-4567", carSize: "big" as const }
    await expect(createBooking(db, triton, now)).resolves.toMatchObject({ slot: "13:00", price: 1600 })
  })

  it("same car with room in the slot: the unique index answers 'same car'", async () => {
    const db = await freshDb()
    // B210 (1ฌฎ-8901) อยู่รอบ 15:00 ซึ่งยังเหลือ 2 ช่อง: INSERT ผ่านเงื่อนไขนับ แต่ชน one_car_per_slot
    const again = { ...newGuest, slot: "15:00", plate: "1ฌฎ-8901", phone: "081-234-1010" }
    await expect(createBooking(db, again, now)).rejects.toMatchObject({ kind: "conflict", message: "รถคันนี้จองรอบนี้ไว้แล้ว" })
  })

  it("moveBooking: same slot is fine, into a full slot is 409, past slot is 400", async () => {
    const db = await freshDb()
    await expect(moveBooking(db, "B201", { date: "2026-11-17", slot: "09:00" }, now)).resolves.toMatchObject({ slot: "09:00" })
    await expect(moveBooking(db, "B201", { date: "2026-11-17", slot: "11:00" }, now)).rejects.toMatchObject({ message: "รอบนี้เต็มแล้ว" })
    await expect(moveBooking(db, "B201", { date: "2026-11-16", slot: "15:00" }, now)).rejects.toMatchObject({ kind: "invalid" })
  })

  it("guest lookup and cancel by code + phone; cancelling gives the bay back", async () => {
    const db = await freshDb()
    await expect(lookupBooking(db, "GU-7K2P", "081-234-0000")).rejects.toMatchObject({ kind: "not-found" })
    await expect(cancelByGuest(db, "GU-7K2P", "081-234-1001")).resolves.toMatchObject({ id: "B201", status: "cancelled" })
    const { slots } = await getSlots(db, "2026-11-17")
    expect(slots[0]).toMatchObject({ time: "09:00", left: 2 })
  })
})
