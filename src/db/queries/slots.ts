// อ่านรอบ (slots) ของร้าน
// ต่างจาก gear-up-api: ไม่มี lockSlot / lockSlotById (SELECT ... FOR UPDATE)
// D1 ไม่มี Transaction แบบเปิดค้างและไม่มีการล็อกแถว booking-writes.ts จึงกันรอบเกินด้วยคำสั่งเดียวแทน
import { and, asc, eq } from "drizzle-orm"
import type { Db } from "../index.ts"
import { slots } from "../schema.ts"

export type SlotRow = typeof slots.$inferSelect

export function slotsOn(db: Db, day: string): Promise<SlotRow[]> {
  return db.select().from(slots).where(eq(slots.day, day)).orderBy(asc(slots.time))
}

// หารอบจากวันและเวลา services ใช้เช็กว่ามีรอบนี้ไหม และผ่านไปแล้วหรือยัง
export async function findSlot(db: Db, day: string, time: string): Promise<SlotRow | undefined> {
  const [row] = await db
    .select()
    .from(slots)
    .where(and(eq(slots.day, day), eq(slots.time, time)))
  return row
}
