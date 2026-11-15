// คุณขวัญปิดงาน (done) หรือยกเลิก (cancelled) การจอง
// ยกเลิกไม่ลบแถว: ประวัติยังอยู่ และช่องคืนให้ร้านเพราะ cancelled ไม่นับเป็นช่องที่ใช้
import { and, eq } from "drizzle-orm"
import type { Db } from "../db/index.ts"
import { bookings } from "../db/schema.ts"
import { findBookingById, type BookingView } from "../db/queries/bookings.ts"
import { canChangeStatus, ONLY_BOOKED } from "../rules/booking-rules.ts"
import { conflict, notFound } from "./errors.ts"

export async function changeStatus(db: Db, id: string, to: "cancelled" | "done"): Promise<BookingView> {
  const booking = await findBookingById(db, id)
  if (!booking) throw notFound("ไม่พบการจองนี้")
  const check = canChangeStatus(booking)
  if (!check.ok) throw conflict(check.reason)

  // WHERE status = 'booked' ด้วย: ถ้าระหว่างนี้มีคนปิดงานไปก่อน แถวจะไม่ถูกแก้ซ้ำ
  const updated = await db
    .update(bookings)
    .set({ status: to })
    .where(and(eq(bookings.id, id), eq(bookings.status, "booked")))
    .returning({ id: bookings.id })
  if (updated.length === 0) throw conflict(ONLY_BOOKED)

  return { ...booking, status: to }
}
