// ช่องว่างของแต่ละรอบในหนึ่งวัน: หน้าจองของลูกค้าเรียกอันนี้
import type { Db } from "../db/index.ts"
import { bookingsOn } from "../db/queries/bookings.ts"
import { slotsOn, type SlotRow } from "../db/queries/slots.ts"
import { BAYS, baysLeft, slotMessage, type Slot } from "../rules/booking-rules.ts"

export type SlotView = { time: string; bays: number; left: number; message: string }

// แถวในตาราง slots ใช้ชื่อคอลัมน์ day ส่วนกฎใน rules/ ใช้ date (ตาม typescript-basics)
export function toRuleSlot(row: SlotRow): Slot {
  return { date: row.day, time: row.time, bays: row.bays }
}

export async function getSlots(db: Db, date: string) {
  const [rows, list] = await Promise.all([slotsOn(db, date), bookingsOn(db, date)])
  // นับช่องว่างด้วย baysLeft ตัวเดียวกับ typescript-basics ไม่เขียนการนับใหม่
  // (AI ชอบนับการจองที่ยกเลิกแล้วด้วย ได้ "เหลือ 2" แทน "เหลือ 3" ที่รอบ 13:00)
  const slots: SlotView[] = rows.map((row) => {
    const left = baysLeft(toRuleSlot(row), list)
    return { time: row.time, bays: row.bays, left, message: slotMessage(left) }
  })
  // Shape เดียวกับ slots.json ของคอร์ส javascript-web (+ bays และ message ของแต่ละรอบ)
  return { date, bays: BAYS, slots }
}
