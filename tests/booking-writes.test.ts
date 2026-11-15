// สัญญาของ db/queries/booking-writes.ts: ฐานข้อมูลตัวไหนก็ต้องตอบแบบนี้
// ยกมาจาก gear-up-api ทั้งไฟล์: เวอร์ชัน D1 ต้องผ่าน Test ชุดเดียวกับ Postgres (ต่างแค่ helpers.ts)
import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { isUniqueViolation } from "../src/db/errors.ts"
import { insertBookingIfRoom, moveBookingIfRoom } from "../src/db/queries/booking-writes.ts"
import { ensureCustomerCar } from "../src/db/queries/customers.ts"
import { findSlot } from "../src/db/queries/slots.ts"
import { cars, customers } from "../src/db/schema.ts"
import { freshDb } from "./helpers.ts"

async function slotId(db: Awaited<ReturnType<typeof freshDb>>, time: string) {
  const slot = await findSlot(db, "2026-11-17", time)
  return slot!.id
}
// รถของคุณข้าวหอม (C10) ซึ่งมีอยู่ในร้านแล้ว จองเฉพาะรอบ 15:00 (B210)
const row = (slotId: number, plate = "1ฌฎ-8901") => ({
  code: "GU-TEST",
  slotId,
  plate,
  serviceId: "oil",
  price: 1600,
  phone: "081-234-1010",
})

describe("insertBookingIfRoom / moveBookingIfRoom", () => {
  it("inserts when there is room", async () => {
    const db = await freshDb()
    const result = await insertBookingIfRoom(db, row(await slotId(db, "13:00")))
    expect(result).toEqual({ status: "ok", id: "B212" })
  })

  it("full slot → 'full', nothing written", async () => {
    const db = await freshDb()
    expect(await insertBookingIfRoom(db, row(await slotId(db, "11:00")))).toEqual({ status: "full" })
  })

  it("same car in the slot → 'same-car'", async () => {
    const db = await freshDb()
    expect(await insertBookingIfRoom(db, row(await slotId(db, "15:00")))).toEqual({ status: "same-car" })
  })

  it("move: 'ok', 'full', and 'not-booked' for a cancelled booking", async () => {
    const db = await freshDb()
    expect(await moveBookingIfRoom(db, "B201", await slotId(db, "13:00"))).toEqual({ status: "ok" })
    expect(await moveBookingIfRoom(db, "B210", await slotId(db, "11:00"))).toEqual({ status: "full" })
    expect(await moveBookingIfRoom(db, "B209", await slotId(db, "15:00"))).toEqual({ status: "not-booked" })
  })
})

// รถใหม่และลูกค้าใหม่ที่มาพร้อมกัน (กดจองสองครั้ง): ถ้าไม่มี ON CONFLICT DO NOTHING
// คำขอที่สองชน Primary Key ของ cars หรือ Unique ของ customers.phone (500) Test ระดับนี้ทำให้หลายคำขอสลับกันจริง
describe("ensureCustomerCar under parallel requests", () => {
  const guest = { customer: "คุณทดสอบ", phone: "089-000-0001", car: "Toyota Yaris Ativ", plate: "9กก-9999", carSize: "small" as const }

  it("the same new car twice at once: no crash, one car, one customer", async () => {
    const db = await freshDb()
    const results = await Promise.allSettled([ensureCustomerCar(db, guest), ensureCustomerCar(db, guest)])
    expect(results.map((r) => r.status)).toEqual(["fulfilled", "fulfilled"])
    expect(await db.select().from(cars).where(eq(cars.plate, guest.plate))).toHaveLength(1)
    expect(await db.select().from(customers).where(eq(customers.phone, guest.phone))).toHaveLength(1)
  })

  it("two new cars with the same new phone at once: one customer owns both", async () => {
    const db = await freshDb()
    await Promise.all([ensureCustomerCar(db, guest), ensureCustomerCar(db, { ...guest, plate: "9กก-7777" })])
    const owners = await db.select().from(customers).where(eq(customers.phone, guest.phone))
    expect(owners).toHaveLength(1)
    const owned = await db.select().from(cars).where(eq(cars.customerId, owners[0]!.id))
    expect(owned).toHaveLength(2)
  })

  it("five new cars with the same new phone at once: no crash, one customer owns all five", async () => {
    const db = await freshDb()
    const plates = [1, 2, 3, 4, 5].map((n) => `9กก-000${n}`)
    const results = await Promise.allSettled(plates.map((plate) => ensureCustomerCar(db, { ...guest, plate })))
    expect(results.every((r) => r.status === "fulfilled")).toBe(true)
    const owners = await db.select().from(customers).where(eq(customers.phone, guest.phone))
    expect(owners).toHaveLength(1)
    expect(await db.select().from(cars).where(eq(cars.customerId, owners[0]!.id))).toHaveLength(5)
  })
})

// หนึ่งเบอร์ = ลูกค้าหนึ่งคน: ฐานข้อมูลกันเอง (Unique customers_phone_unique) ไม่ได้พึ่งโค้ดอย่างเดียว
describe("customers.phone is unique in the database", () => {
  it("a second customer with the same phone is rejected", async () => {
    const db = await freshDb()
    // คุณปอนด์ (C01) ใช้เบอร์ 081-234-1001 อยู่แล้ว
    const error = await db
      .insert(customers)
      .values({ id: "C99", name: "คนอื่น", phone: "081-234-1001" })
      .then(() => undefined, (e: unknown) => e)
    expect(isUniqueViolation(error, "customers_phone_unique")).toBe(true)
    expect(await db.select().from(customers).where(eq(customers.phone, "081-234-1001"))).toHaveLength(1)
  })
})
