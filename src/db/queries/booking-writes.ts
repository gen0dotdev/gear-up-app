// เขียนการจองแบบ "ต้องมีที่ว่างจริงตอนเขียน" เวอร์ชัน D1
// ชื่อฟังก์ชัน พารามิเตอร์ และผลลัพธ์เหมือน gear-up-api ทุกอย่าง services/ จึงเรียกได้โดยไม่แก้
//
// กฎ "ไม่เกิน 4 คัน" ต้องนับหลายแถว ถ้านับก่อนแล้วค่อยเขียนทีหลังแบบแยกคำสั่ง
// สองคนที่กดจองช่องสุดท้ายพร้อมกันจะนับได้ 3 ทั้งคู่ แล้วเข้าได้ทั้งคู่ (5 คัน)
//
// - Postgres (gear-up-api): Transaction + ล็อกแถวของรอบ (SELECT ... FOR UPDATE) คำขอที่สองรอคำขอแรก
// - D1 (ไฟล์นี้): ไม่มี Transaction แบบเปิดค้างข้าม await และไม่มีการล็อกแถว
//   จึงรวม "นับ" กับ "เขียน" ไว้ใน SQL คำสั่งเดียว:
//     INSERT ... SELECT ... WHERE (นับการจองที่ใช้ช่องในรอบ) < bays
//   SQLite ทำคำสั่งเดียวจนจบก่อนเริ่มคำสั่งถัดไปเสมอ (Atomic) การนับกับการเขียนจึงแยกกันไม่ได้
//   ไม่มีที่ → เขียนได้ 0 แถว (ไม่ใช่ Error)
//
// กฎ "รถซ้ำในรอบ" กันด้วย Unique Index one_car_per_slot (เหมือน Postgres) ชนแล้ว → "same-car"
import { and, eq, ne, sql } from "drizzle-orm"
import type { Db } from "../index.ts"
import { isUniqueViolation } from "../errors.ts"
import { bookings } from "../schema.ts"

export type NewBookingRow = {
  code: string
  slotId: number
  plate: string
  serviceId: string
  price: number
  phone: string
}

export type InsertResult = { status: "ok"; id: string } | { status: "full" } | { status: "same-car" }
export type MoveResult = { status: "ok" } | { status: "full" } | { status: "same-car" } | { status: "not-booked" }

// การจองที่ใช้ช่องในรอบนี้ (booked และ done; cancelled คืนช่องแล้ว) ใช้ซ้ำในทั้งสองคำสั่ง
const activeIn = (slotId: number) =>
  sql`(SELECT count(*) FROM bookings WHERE slot_id = ${slotId} AND status <> 'cancelled')`
const baysOf = (slotId: number) => sql`(SELECT bays FROM slots WHERE id = ${slotId})`

// เขียนไม่ได้ (0 แถว) แปลว่าเต็ม หรือรถคันนี้อยู่ในรอบแล้ว อ่านดูอีกครั้งเพื่อเลือกข้อความให้ถูก
// (อ่านหลังเขียนไม่เสียหาย: แค่เลือกคำตอบ ไม่ได้ตัดสินว่าจะเขียนหรือไม่)
// เช็กรถซ้ำก่อนรอบเต็ม ลำดับเดียวกับ canBook ใน rules/
async function whyNoRoom(db: Db, slotId: number, plate: string, skipId?: string): Promise<"full" | "same-car"> {
  const [same] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.slotId, slotId),
        eq(bookings.plate, plate),
        ne(bookings.status, "cancelled"),
        skipId ? ne(bookings.id, skipId) : undefined,
      ),
    )
  return same ? "same-car" : "full"
}

export async function insertBookingIfRoom(db: Db, row: NewBookingRow): Promise<InsertResult> {
  try {
    // id ใหม่ (B212, ...) คำนวณในคำสั่งเดียวกันด้วย MAX + 1 เพราะ SQLite ไม่มี Sequence
    const [inserted] = await db.all<{ id: string }>(sql`
      INSERT INTO bookings (id, code, slot_id, plate, service_id, price, phone)
      SELECT
        'B' || (COALESCE((SELECT MAX(CAST(substr(id, 2) AS INTEGER)) FROM bookings), 0) + 1),
        ${row.code}, ${row.slotId}, ${row.plate}, ${row.serviceId}, ${row.price}, ${row.phone}
      WHERE ${activeIn(row.slotId)} < ${baysOf(row.slotId)}
      RETURNING id`)
    if (inserted) return { status: "ok", id: inserted.id }
    return { status: await whyNoRoom(db, row.slotId, row.plate) }
  } catch (error) {
    // ด่านสุดท้ายของกฎรถซ้ำ: Unique Index one_car_per_slot
    if (isUniqueViolation(error, "one_car_per_slot")) return { status: "same-car" }
    throw error
  }
}

// ย้ายการจองไปรอบ slotId เฉพาะเมื่อยังเป็น booked และรอบปลายทางมีที่ (ราคาไม่เปลี่ยน)
// UPDATE คำสั่งเดียวที่มีเงื่อนไขครบ ไม่นับการจองนี้เอง (ย้ายไปรอบเดิมไม่ถูกตอบว่าเต็มหรือรถซ้ำ)
export async function moveBookingIfRoom(db: Db, id: string, slotId: number): Promise<MoveResult> {
  try {
    const moved = await db.all<{ id: string }>(sql`
      UPDATE bookings SET slot_id = ${slotId}
      WHERE id = ${id} AND status = 'booked'
        AND (SELECT count(*) FROM bookings WHERE slot_id = ${slotId} AND status <> 'cancelled' AND id <> ${id})
            < ${baysOf(slotId)}
      RETURNING id`)
    if (moved.length > 0) return { status: "ok" }

    // ย้ายไม่ได้: หาเหตุผล (ลำดับเดียวกับ gear-up-api: ไม่ใช่ booked → รถซ้ำ → เต็ม)
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id))
    if (!booking || booking.status !== "booked") return { status: "not-booked" }
    return { status: await whyNoRoom(db, slotId, booking.plate, id) }
  } catch (error) {
    if (isUniqueViolation(error, "one_car_per_slot")) return { status: "same-car" }
    throw error
  }
}
