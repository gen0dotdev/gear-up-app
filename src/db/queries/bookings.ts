// อ่านการจองออกมาในรูป Booking (Shape เดียวกับ admin board)
// การจองหนึ่งแถวกระจายอยู่ 5 ตาราง (การจอง, รอบ, รถ, ลูกค้า, ช่าง) คิวรีนี้ Join ให้ครบในที่เดียว
// ทุก service ที่ต้องการการจองเรียกฟังก์ชันในไฟล์นี้ ไม่ Join เอง จะได้ไม่มีสองที่ที่ตอบไม่ตรงกัน
import { and, asc, eq, type SQL } from "drizzle-orm"
import type { Db } from "../index.ts"
import { bookings, cars, customers, mechanics, slots } from "../schema.ts"
import type { Booking, ServiceId } from "../../rules/booking-rules.ts"

// ที่ API ตอบ: Booking ของ react-basics + รหัสจอง + ราคาที่ตกลงตอนจอง
// mechanicId ให้หน้ากระดานรู้ว่าเลือกช่างคนไหนอยู่ (mechanic คือชื่อที่แสดง)
export type BookingView = Booking & { code: string; price: number; mechanicId: string | null }

async function selectBookings(db: Db, where: SQL | undefined): Promise<BookingView[]> {
  const rows = await db
    .select({
      id: bookings.id,
      code: bookings.code,
      date: slots.day,
      slot: slots.time,
      customer: customers.name,
      // เบอร์ของการจองนี้ (ที่ลูกค้ากรอก) ไม่ใช่เบอร์ในตาราง customers
      phone: bookings.phone,
      car: cars.model,
      plate: bookings.plate,
      carSize: cars.size,
      service: bookings.serviceId,
      mechanic: mechanics.name,
      mechanicId: bookings.mechanicId,
      status: bookings.status,
      note: bookings.note,
      price: bookings.price,
    })
    .from(bookings)
    .innerJoin(slots, eq(slots.id, bookings.slotId))
    .innerJoin(cars, eq(cars.plate, bookings.plate))
    .innerJoin(customers, eq(customers.id, cars.customerId))
    // LEFT JOIN: การจองจากลูกค้ายังไม่มีช่าง (mechanic_id เป็น NULL) ก็ต้องออกมาด้วย
    .leftJoin(mechanics, eq(mechanics.id, bookings.mechanicId))
    .where(where)
    .orderBy(asc(slots.day), asc(slots.time), asc(bookings.id))

  return rows.map(({ mechanic, note, service, ...row }) => ({
    ...row,
    // ตาราง services เก็บ id เป็น text ทั่วไป แต่ร้านมีแค่ 4 บริการนี้ (ไม่มี API เพิ่มบริการ)
    service: service as ServiceId,
    mechanic: mechanic ?? "", // ยังไม่ได้มอบหมายช่าง: ส่ง "" ตาม Type ของ admin board
    ...(note ? { note } : {}),
  }))
}

export function bookingsOn(db: Db, day: string): Promise<BookingView[]> {
  return selectBookings(db, eq(slots.day, day))
}

export function bookingsInSlot(db: Db, slotId: number): Promise<BookingView[]> {
  return selectBookings(db, eq(bookings.slotId, slotId))
}

export async function findBookingById(db: Db, id: string): Promise<BookingView | undefined> {
  const [row] = await selectBookings(db, eq(bookings.id, id))
  return row
}

export async function findBookingByCode(db: Db, code: string, phone: string): Promise<BookingView | undefined> {
  // เทียบกับเบอร์ที่กรอกตอนจอง: คนที่พารถของคนอื่นมาจองก็หาการจองของตัวเองเจอ
  const [row] = await selectBookings(db, and(eq(bookings.code, code), eq(bookings.phone, phone)))
  return row
}
