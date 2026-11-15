// ช่างของร้าน และการมอบหมายช่างให้การจอง
import { and, asc, eq } from "drizzle-orm"
import type { Db } from "../index.ts"
import { bookings, mechanics } from "../schema.ts"

export type MechanicRow = typeof mechanics.$inferSelect

export function listMechanics(db: Db): Promise<MechanicRow[]> {
  return db.select().from(mechanics).orderBy(asc(mechanics.id))
}

export async function findMechanic(db: Db, id: string): Promise<MechanicRow | undefined> {
  const [row] = await db.select().from(mechanics).where(eq(mechanics.id, id))
  return row
}

// แก้เฉพาะการจองที่ยังเป็น booked (WHERE status = 'booked') คืนจำนวนแถวที่แก้ได้
export async function setBookingMechanic(db: Db, bookingId: string, mechanicId: string | null): Promise<number> {
  const updated = await db
    .update(bookings)
    .set({ mechanicId })
    .where(and(eq(bookings.id, bookingId), eq(bookings.status, "booked")))
    .returning({ id: bookings.id })
  return updated.length
}
