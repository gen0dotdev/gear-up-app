// "การจองของฉัน": ลูกค้าดูหรือยกเลิกการจองด้วยรหัสจอง + เบอร์โทร (ไม่ต้องล็อกอิน)
import type { Db } from "../db/index.ts"
import { findBookingByCode, type BookingView } from "../db/queries/bookings.ts"
import { changeStatus } from "./change-status.ts"
import { notFound } from "./errors.ts"

// รหัสถูกแต่เบอร์ผิด ตอบเหมือน "ไม่มีรหัสนี้" ทุกประการ
// คนที่เดารหัสจะได้ไม่รู้ว่ารหัสไหนมีอยู่จริง
const NOT_FOUND = "ไม่พบการจองนี้ ตรวจรหัสจองและเบอร์โทรอีกครั้ง"

export async function lookupBooking(db: Db, code: string, phone: string): Promise<BookingView> {
  const booking = await findBookingByCode(db, code, phone)
  if (!booking) throw notFound(NOT_FOUND)
  return booking
}

export async function cancelByGuest(db: Db, code: string, phone: string): Promise<BookingView> {
  const booking = await lookupBooking(db, code, phone)
  return changeStatus(db, booking.id, "cancelled")
}
