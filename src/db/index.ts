// Type กลางของฐานข้อมูล: services/ รับ db แบบนี้เป็นพารามิเตอร์ตัวแรก
// ใน gear-up-api Db คือ PgDatabase (Neon หรือ PGlite) ที่นี่คือ Drizzle บน D1
// services/ import แค่ชื่อ Db จากไฟล์นี้ จึงไม่ต้องรู้ว่าข้างล่างเป็นฐานข้อมูลอะไร
//
// ตาราง Login ของ Better Auth ไม่อยู่ใน schema นี้: Better Auth คุยกับ D1 เอง (src/auth/auth.ts)
import type { DrizzleD1Database } from "drizzle-orm/d1"
import * as schema from "./schema.ts"

export { schema }
export type Db = DrizzleD1Database<typeof schema>
