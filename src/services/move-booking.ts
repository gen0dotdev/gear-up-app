// คุณขวัญย้ายการจองไปรอบอื่น (ลูกค้าโทรมาขอเปลี่ยนเวลา)
// รอบใหม่ต้องผ่านกฎเดียวกับการจองใหม่ทุกข้อ: มีรอบนี้ ยังไม่ผ่านไป ไม่เต็ม และรถไม่ซ้ำ
// ไม่มี Transaction ในไฟล์นี้: "เช็กว่ามีที่แล้วย้าย" เป็นงานเดียวใน db/queries/booking-writes.ts
import type { Db } from "../db/index.ts"
import { findBookingById, type BookingView } from "../db/queries/bookings.ts"
import { moveBookingIfRoom } from "../db/queries/booking-writes.ts"
import { findSlot } from "../db/queries/slots.ts"
import { canChangeStatus, FULL, isPast, ONLY_BOOKED, SAME_CAR } from "../rules/booking-rules.ts"
import { conflict, invalid, notFound } from "./errors.ts"
import { toRuleSlot } from "./slots.ts"

export type MoveTo = { date: string; slot: string }

export async function moveBooking(db: Db, id: string, to: MoveTo, now: Date): Promise<BookingView> {
  const booking = await findBookingById(db, id)
  if (!booking) throw notFound("ไม่พบการจองนี้")
  // การจองที่ปิดงานหรือยกเลิกแล้วเป็นประวัติ ย้ายไม่ได้
  const status = canChangeStatus(booking)
  if (!status.ok) throw conflict(status.reason)

  const slotRow = await findSlot(db, to.date, to.slot)
  if (!slotRow) throw notFound("ไม่พบรอบนี้ (ร้านเปิดวันจันทร์ถึงวันเสาร์)")
  if (isPast(toRuleSlot(slotRow), now)) throw invalid("รอบนี้ผ่านไปแล้ว")

  // ย้ายไปรอบเดิมไม่ถูกตอบว่ารถซ้ำ: db/ ไม่นับการจองนี้เอง ราคาที่ตกลงตอนจองไม่เปลี่ยน
  const result = await moveBookingIfRoom(db, id, slotRow.id)
  if (result.status === "same-car") throw conflict(SAME_CAR)
  if (result.status === "full") throw conflict(FULL)
  if (result.status === "not-booked") throw conflict(ONLY_BOOKED) // มีคนปิดงานหรือยกเลิกไประหว่างนี้

  const moved = await findBookingById(db, id)
  if (!moved) throw notFound("ไม่พบการจองนี้")
  return moved
}
