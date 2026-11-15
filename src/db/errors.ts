// แปลง Error ของ D1 ให้ชั้นบนอ่านง่าย (แทนรหัส 23505 ของ Postgres)
// SQLite ไม่มีรหัสแยกชนิดและไม่บอกชื่อ Index บอกเป็นข้อความพร้อมชื่อคอลัมน์ เช่น
//   "UNIQUE constraint failed: bookings.slot_id, bookings.plate"
// Drizzle ห่อ Error ไว้ใน DrizzleQueryError (ตัวจริงอยู่ที่ .cause) จึงไล่ดูข้อความทั้งสาย
import { DrizzleQueryError } from "drizzle-orm"

// ชื่อ Index (ชื่อเดียวกับ Postgres) → คอลัมน์ที่ SQLite จะบอกในข้อความ
const COLUMNS: Record<string, string> = {
  one_car_per_slot: "bookings.slot_id, bookings.plate",
}

function messagesOf(error: unknown): string {
  const parts: string[] = []
  let current: unknown = error
  while (current instanceof Error) {
    parts.push(current.message)
    current = current instanceof DrizzleQueryError || current.cause ? current.cause : undefined
  }
  return parts.join(" | ")
}

export function isUniqueViolation(error: unknown, constraint: string): boolean {
  const columns = COLUMNS[constraint]
  return columns !== undefined && messagesOf(error).includes(`UNIQUE constraint failed: ${columns}`)
}
