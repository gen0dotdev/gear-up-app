// คุณขวัญมอบหมายช่างให้การจองบนกระดานงาน (ลูกค้าจองโดยไม่เลือกช่าง)
// mechanicId เป็น null = เอาช่างออก (ยังไม่มอบหมาย)
import type { Db } from "../db/index.ts"
import { findBookingById, type BookingView } from "../db/queries/bookings.ts"
import { findMechanic, setBookingMechanic } from "../db/queries/mechanics.ts"
import { canChangeStatus, canDoService, ONLY_BOOKED } from "../rules/booking-rules.ts"
import { conflict, notFound } from "./errors.ts"

export async function assignMechanic(db: Db, bookingId: string, mechanicId: string | null): Promise<BookingView> {
  const booking = await findBookingById(db, bookingId)
  if (!booking) throw notFound("ไม่พบการจองนี้")
  // งานที่ปิดหรือยกเลิกแล้วเป็นประวัติ ไม่เปลี่ยนช่างย้อนหลัง
  const status = canChangeStatus(booking)
  if (!status.ok) throw conflict(status.reason)

  if (mechanicId !== null) {
    const mechanic = await findMechanic(db, mechanicId)
    if (!mechanic) throw notFound("ไม่พบช่างคนนี้")
    const skill = canDoService(mechanic, booking.service)
    if (!skill.ok) throw conflict(skill.reason)
  }

  // ถ้าระหว่างนี้มีคนปิดงานไปก่อน จะแก้ไม่ได้ (0 แถว) และตอบ 409 เหมือนกัน
  if ((await setBookingMechanic(db, bookingId, mechanicId)) === 0) throw conflict(ONLY_BOOKED)

  const updated = await findBookingById(db, bookingId)
  if (!updated) throw notFound("ไม่พบการจองนี้")
  return updated
}
