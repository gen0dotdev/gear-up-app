// ลูกค้าและรถ: การจองแบบ Guest ต้องมีแถวใน customers และ cars ก่อน (Foreign Key)
// ต่างจาก gear-up-api เรื่องเดียว: id ลูกค้าใหม่ (C18, C19, ...)
//   Postgres: DEFAULT 'C' || nextval('customer_no')
//   D1:       ไม่มี Sequence จึงคำนวณ MAX + 1 ในคำสั่ง INSERT เดียวกัน
//             คำสั่งเดียวใน D1 ทำจนจบก่อนคำสั่งอื่นเริ่ม สองคำขอพร้อมกันจึงไม่ได้เลขซ้ำ
// ที่เหมือนกัน: คำขอพร้อมกันสองคำขอ (เช่น ลูกค้ากดปุ่มจองสองครั้ง) อ่านแล้ว "ยังไม่มี" ทั้งคู่ แล้วต่างคนต่างเพิ่ม
//   ฐานข้อมูลกันข้อมูลซ้ำให้แล้ว (cars.plate เป็น Primary Key, customers.phone เป็น Unique)
//   จึงเขียน INSERT ... ON CONFLICT DO NOTHING ทั้งสองตาราง ใครเพิ่มก่อนก็ได้ อีกคำขอใช้แถวนั้น ไม่มี 500
//   (Test: tests/booking-writes.test.ts และ tests/services.test.ts)
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

// หาลูกค้าจากเบอร์โทร ไม่เจอก็สร้างใหม่ เบอร์เดียวกันไม่มีวันได้สองคน
async function customerIdFor(tx: Db, input: GuestCar): Promise<string> {
  const [found] = await tx.select().from(customers).where(eq(customers.phone, input.phone))
  if (found) return found.id
  // ON CONFLICT (phone) DO NOTHING: อีกคำขอเพิ่มเบอร์นี้ไปก่อนแล้วก็ไม่เป็นไร ใช้ลูกค้าคนนั้น
  // WHERE true: SQLite ต้องมี WHERE ก่อน ON CONFLICT ใน INSERT ... SELECT
  //   ไม่อย่างนั้นจะอ่าน ON ว่าเป็นส่วนของ JOIN ใน FROM
  await tx.run(sql`
    INSERT INTO customers (id, name, phone)
    SELECT 'C' || (COALESCE(MAX(CAST(substr(id, 2) AS INTEGER)), 0) + 1), ${input.customer}, ${input.phone}
    FROM customers
    WHERE true
    ON CONFLICT (phone) DO NOTHING`)
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
