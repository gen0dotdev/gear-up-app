// ลูกค้าและรถ: การจองแบบ Guest ต้องมีแถวใน customers และ cars ก่อน (Foreign Key)
// ต่างจาก gear-up-api สองเรื่อง:
// 1. id ลูกค้าใหม่ (C18, C19, ...)
//    Postgres: DEFAULT 'C' || nextval('customer_no')
//    D1:       ไม่มี Sequence จึงคำนวณ MAX + 1 ในคำสั่ง INSERT เดียวกัน
//              คำสั่งเดียวใน D1 ทำจนจบก่อนคำสั่งอื่นเริ่ม สองคำขอพร้อมกันจึงไม่ได้เลขซ้ำ
// 2. รถใหม่คันเดียวกันจองพร้อมกันสองคำขอ (เช่น ลูกค้ากดปุ่มจองสองครั้ง)
//    ทั้งสองคำขออ่านแล้ว "ยังไม่มีรถคันนี้" แล้วต่างคนต่างเพิ่ม คำขอที่สองชน Primary Key → 500
//    จึงเขียนแบบ "เพิ่มถ้ายังไม่มี" ในคำสั่งเดียว (Test: tests/services.test.ts รถคันเดียวกันแย่งรอบเดียว)
import { eq, sql } from "drizzle-orm"
import type { Db } from "../index.ts"
import { cars, customers } from "../schema.ts"
import type { CarSize } from "../../rules/booking-rules.ts"

export type GuestCar = {
  customer: string
  phone: string
  car: string
  plate: string
  carSize: CarSize
}

// หาลูกค้าจากเบอร์โทร ไม่เจอก็สร้างใหม่
async function customerIdFor(tx: Db, input: GuestCar): Promise<string> {
  const [found] = await tx.select().from(customers).where(eq(customers.phone, input.phone))
  if (found) return found.id
  // HAVING NOT EXISTS: ถ้าระหว่างนี้มีคำขออื่นเพิ่มเบอร์นี้ไปแล้ว คำสั่งนี้ไม่เพิ่มซ้ำ
  await tx.run(sql`
    INSERT INTO customers (id, name, phone)
    SELECT 'C' || (COALESCE(MAX(CAST(substr(id, 2) AS INTEGER)), 0) + 1), ${input.customer}, ${input.phone}
    FROM customers
    HAVING NOT EXISTS (SELECT 1 FROM customers WHERE phone = ${input.phone})`)
  const [customer] = await tx.select().from(customers).where(eq(customers.phone, input.phone))
  if (!customer) throw new Error("สร้างลูกค้าไม่สำเร็จ")
  return customer.id
}

// คืนทะเบียนรถที่ใช้จองได้ สร้างลูกค้าและรถให้ถ้ายังไม่มี
// - รถคันนี้เคยมาแล้ว: ใช้ข้อมูลรถเดิมของร้าน (รุ่นและขนาดที่ร้านบันทึกไว้ ไม่เชื่อที่ลูกค้ากรอก)
// - รถใหม่: ผูกกับลูกค้าจากเบอร์โทร (คนเดิมหรือคนใหม่) แล้วเพิ่มรถ
export async function ensureCustomerCar(tx: Db, input: GuestCar): Promise<string> {
  const [car] = await tx.select().from(cars).where(eq(cars.plate, input.plate))
  if (car) return car.plate

  const customerId = await customerIdFor(tx, input)
  // onConflictDoNothing: อีกคำขอเพิ่มรถคันนี้ไปก่อนแล้วก็ไม่เป็นไร ใช้แถวนั้น
  await tx
    .insert(cars)
    .values({ plate: input.plate, customerId, model: input.car, size: input.carSize })
    .onConflictDoNothing()
  return input.plate
}

// ขนาดรถตามที่ร้านบันทึกไว้ (ใช้คิดราคา) ไม่ใช้ carSize ที่ลูกค้ากรอก ถ้ารถคันนี้เคยมาแล้ว
export async function carSizeOf(tx: Db, plate: string): Promise<CarSize> {
  const [car] = await tx.select({ size: cars.size }).from(cars).where(eq(cars.plate, plate))
  if (!car) throw new Error(`ไม่พบรถทะเบียน ${plate}`)
  return car.size
}
