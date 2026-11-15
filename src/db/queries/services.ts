// อ่านและแก้ตารางบริการ (services) ชื่อไฟล์ซ้ำกับโฟลเดอร์ src/services/ แต่คนละเรื่อง:
// ไฟล์นี้คือ "ตาราง services" ส่วน src/services/ คือ "ชั้น Business Logic"
import { asc, eq } from "drizzle-orm"
import type { Db } from "../index.ts"
import { services } from "../schema.ts"

export type ServiceRow = typeof services.$inferSelect
export type ServiceChanges = Pick<ServiceRow, "minutes" | "price" | "priceBig">

export function listServices(db: Db): Promise<ServiceRow[]> {
  return db.select().from(services).orderBy(asc(services.price))
}

export async function findService(db: Db, id: string): Promise<ServiceRow | undefined> {
  const [row] = await db.select().from(services).where(eq(services.id, id))
  return row
}

export async function updateService(db: Db, id: string, changes: ServiceChanges): Promise<ServiceRow | undefined> {
  const [row] = await db.update(services).set(changes).where(eq(services.id, id)).returning()
  return row
}
