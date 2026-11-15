// ลูกค้าจองรอบ (Guest ไม่ต้องล็อกอิน)
// ไฟล์นี้ไม่มี Transaction หรือการล็อก: การรับประกัน "ไม่เกิน 4 คัน" อยู่ใน db/queries/booking-writes.ts
// services จึงย้ายไปใช้กับ D1 (fullstack-astro) ได้โดยไม่ต้องแก้
import type { Db } from "../db/index.ts"
import { findBookingById, type BookingView } from "../db/queries/bookings.ts"
import { insertBookingIfRoom } from "../db/queries/booking-writes.ts"
import { carSizeOf, ensureCustomerCar, type GuestCar } from "../db/queries/customers.ts"
import { findService } from "../db/queries/services.ts"
import { findSlot } from "../db/queries/slots.ts"
import { FULL, isPast, priceFromTable, SAME_CAR } from "../rules/booking-rules.ts"
import { newBookingCode } from "./booking-code.ts"
import { conflict, invalid, notFound } from "./errors.ts"
import { toRuleSlot } from "./slots.ts"

export type NewBooking = GuestCar & { date: string; slot: string; service: string }

export async function createBooking(db: Db, input: NewBooking, now: Date): Promise<BookingView> {
  const service = await findService(db, input.service)
  if (!service) throw notFound("ไม่พบบริการนี้")
  const slotRow = await findSlot(db, input.date, input.slot)
  if (!slotRow) throw notFound("ไม่พบรอบนี้ (ร้านเปิดวันจันทร์ถึงวันเสาร์)")
  if (isPast(toRuleSlot(slotRow), now)) throw invalid("รอบนี้ผ่านไปแล้ว")

  // ร้านรู้จักลูกค้าและรถไว้ก่อน (ถ้ารอบเต็มก็ไม่เสียหาย: ครั้งหน้าร้านรู้จักรถคันนี้แล้ว)
  const plate = await ensureCustomerCar(db, input)
  // ล็อกราคาไว้ตอนจอง: ราคาปัจจุบันของบริการนี้ ตามขนาดรถที่ร้านบันทึกไว้
  const price = priceFromTable(service, await carSizeOf(db, plate))

  // เช็กรอบว่างและบันทึกเป็นงานเดียว (ดูว่าทำไมใน db/queries/booking-writes.ts)
  const result = await insertBookingIfRoom(db, {
    code: newBookingCode(),
    slotId: slotRow.id,
    plate,
    serviceId: service.id,
    price,
    phone: input.phone, // เบอร์ที่ลูกค้ากรอก ใช้คู่กับรหัสจองใน "การจองของฉัน"
  })
  if (result.status === "same-car") throw conflict(SAME_CAR)
  if (result.status === "full") throw conflict(FULL)

  const booking = await findBookingById(db, result.id)
  if (!booking) throw new Error(`อ่านการจอง ${result.id} ที่เพิ่งบันทึกไม่ได้`)
  return booking
}
