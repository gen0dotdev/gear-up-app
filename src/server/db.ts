// db ของคำขอนี้: services ทุกตัวรับ db เป็นพารามิเตอร์ตัวแรก
// สร้างใหม่ทุกคำขอจาก Binding env.DB (D1) ไม่เก็บไว้ข้ามคำขอ
import { env } from "cloudflare:workers"
import { createDb } from "../db/d1.ts"
import type { Db } from "../db/index.ts"

export type { Db }

export function getDb(): Db {
  return createDb(env.DB)
}
