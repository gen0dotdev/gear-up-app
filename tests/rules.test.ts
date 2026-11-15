// กฎล้วน ๆ (rules/) ไม่มีฐานข้อมูล ไม่มี HTTP: เร็วที่สุดและอ่านง่ายที่สุด
// ตัวเลขทุกตัวมาจาก data sheet ของ Coding path
import { describe, expect, it } from "vitest"
import {
  baysLeft,
  canBook,
  canChangeStatus,
  isPast,
  priceFor,
  slotMessage,
  SLOT_TIMES,
  type Booking,
} from "../src/rules/booking-rules.ts"

const tomorrow = "2026-11-17"
const slot = (time: string) => ({ date: tomorrow, time, bays: 4 })

// การจองพรุ่งนี้แบบย่อ: รอบ, ทะเบียน, สถานะ (B209 ยกเลิก)
const rows: [string, string, Booking["status"]][] = [
  ["09:00", "1กข-1234", "booked"],
  ["09:00", "3ขง-9012", "booked"],
  ["09:00", "5งฉ-7890", "booked"],
  ["11:00", "2กค-5678", "booked"],
  ["11:00", "4คจ-3456", "booked"],
  ["11:00", "6จช-2345", "booked"],
  ["11:00", "7ฉซ-6789", "booked"],
  ["13:00", "8ชฌ-0123", "booked"],
  ["13:00", "9ซญ-4567", "cancelled"],
  ["15:00", "1ฌฎ-8901", "booked"],
  ["15:00", "9ซญ-4567", "booked"],
]
const list: Booking[] = rows.map(([time, plate, status], i) => ({
  id: `B${201 + i}`,
  date: tomorrow,
  slot: time,
  customer: "",
  phone: "",
  car: "",
  plate,
  carSize: "small",
  service: "oil",
  mechanic: "",
  status,
}))

describe("booking rules", () => {
  it("prices: only oil changes for a big car", () => {
    expect(priceFor("oil", "small")).toBe(1200)
    expect(priceFor("oil", "big")).toBe(1600)
    expect(priceFor("tyres", "big")).toBe(800)
    expect(priceFor("brakes", "small")).toBe(2500)
    expect(priceFor("check", "big")).toBe(3500)
  })

  it("bays left tomorrow are 1, 0, 3, 2 (the cancelled B209 gives its bay back)", () => {
    expect(SLOT_TIMES.map((t) => baysLeft(slot(t), list))).toEqual([1, 0, 3, 2])
  })

  it("messages", () => {
    expect(slotMessage(0)).toBe("เต็มแล้ว")
    expect(slotMessage(1)).toBe("เหลือช่องสุดท้าย")
    expect(slotMessage(3)).toBe("เหลือ 3 ช่อง")
  })

  it("11:00 is full", () => {
    expect(canBook(slot("11:00"), "9กก-9999", list)).toEqual({ ok: false, reason: "รอบนี้เต็มแล้ว" })
  })

  it("the same car can't take 09:00 twice", () => {
    expect(canBook(slot("09:00"), "1กข-1234", list)).toEqual({ ok: false, reason: "รถคันนี้จองรอบนี้ไว้แล้ว" })
  })

  it("13:00 is open, even for the car whose booking was cancelled", () => {
    expect(canBook(slot("13:00"), "9กก-9999", list)).toEqual({ ok: true })
    expect(canBook(slot("13:00"), "9ซญ-4567", list)).toEqual({ ok: true })
  })

  it("only booked can change", () => {
    expect(canChangeStatus({ status: "booked" }).ok).toBe(true)
    expect(canChangeStatus({ status: "cancelled" }).ok).toBe(false)
    expect(canChangeStatus({ status: "done" }).ok).toBe(false)
  })

  it("a slot is past once it has started (Thai time)", () => {
    const now = new Date("2026-11-17T09:00:00+07:00")
    expect(isPast(slot("09:00"), now)).toBe(true)
    expect(isPast(slot("11:00"), now)).toBe(false)
  })
})
