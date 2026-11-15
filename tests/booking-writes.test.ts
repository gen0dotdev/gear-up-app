// สัญญาของ db/queries/booking-writes.ts: ฐานข้อมูลตัวไหนก็ต้องตอบแบบนี้
// ยกมาจาก gear-up-api ทั้งไฟล์: เวอร์ชัน D1 ต้องผ่าน Test ชุดเดียวกับ Postgres (ต่างแค่ helpers.ts)
import { describe, expect, it } from "vitest"
import { insertBookingIfRoom, moveBookingIfRoom } from "../src/db/queries/booking-writes.ts"
import { findSlot } from "../src/db/queries/slots.ts"
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
