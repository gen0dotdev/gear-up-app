// มอบหมายช่าง: ข้อเดียวกับ tests/mechanics.test.ts ของ gear-up-api แต่เรียก services ตรง
// (ฝั่ง gear-up-api ทดสอบผ่าน HTTP; ที่นี่ HTTP คือ Action ซึ่งทดสอบใน e2e)
import { describe, expect, it } from "vitest"
import { assignMechanic } from "../src/services/assign-mechanic.ts"
import { changeStatus } from "../src/services/change-status.ts"
import { createBooking } from "../src/services/create-booking.ts"
import { getMechanics } from "../src/services/mechanics.ts"
import { freshDb, newGuest, NOW } from "./helpers.ts"

describe("mechanics on D1", () => {
  it("lists the three mechanics with the services each one does (JSON column → array)", async () => {
    const db = await freshDb()
    expect(await getMechanics(db)).toEqual([
      { id: "beer", name: "ช่างเบียร์", services: ["oil", "tyres", "brakes", "check"] },
      { id: "ohm", name: "ช่างโอม", services: ["tyres", "brakes"] },
      { id: "tum", name: "ช่างตั้ม", services: ["oil", "check"] },
    ])
  })

  it("a guest booking starts unassigned; assign ช่างตั้ม, then unassign", async () => {
    const db = await freshDb()
    const booked = await createBooking(db, newGuest, new Date(NOW))
    expect(booked).toMatchObject({ mechanic: "", mechanicId: null })
    expect(await assignMechanic(db, booked.id, "tum")).toMatchObject({ mechanic: "ช่างตั้ม", mechanicId: "tum" })
    expect(await assignMechanic(db, booked.id, null)).toMatchObject({ mechanic: "", mechanicId: null })
  })

  it("ช่างโอม doesn't do oil changes → conflict", async () => {
    const db = await freshDb()
    await expect(assignMechanic(db, "B201", "ohm")).rejects.toMatchObject({ kind: "conflict", message: "ช่างโอมไม่ได้รับงานบริการนี้" })
  })

  it("a done or cancelled booking can't change mechanic → conflict", async () => {
    const db = await freshDb()
    await changeStatus(db, "B201", "done")
    await expect(assignMechanic(db, "B201", "beer")).rejects.toMatchObject({ kind: "conflict" })
    await expect(assignMechanic(db, "B209", "beer")).rejects.toMatchObject({ kind: "conflict" })
  })

  it("unknown mechanic or booking → not-found", async () => {
    const db = await freshDb()
    await expect(assignMechanic(db, "B201", "nobody")).rejects.toMatchObject({ kind: "not-found" })
    await expect(assignMechanic(db, "B999", "tum")).rejects.toMatchObject({ kind: "not-found" })
  })
})
