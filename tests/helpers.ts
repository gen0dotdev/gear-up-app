// ตัวช่วยของ Test (แทน helpers.ts ของ gear-up-api ที่ใช้ PGlite)
// freshDb() คืน Drizzle บน D1 ของ Test ข้อมูลตัวอย่างถูกใส่ใหม่ก่อนทุก Test แล้ว (setup.ts)
import { env } from "cloudflare:workers"
import { createDb } from "../src/db/d1.ts"
import type { Db } from "../src/db/index.ts"

// "ตอนนี้" ของทุก Test: วันจันทร์ 16 พ.ย. 2026 หกโมงเย็น รอบของพรุ่งนี้ (17 พ.ย.) ยังจองได้
export const NOW = "2026-11-16T18:00:00+07:00"

export async function freshDb(): Promise<Db> {
  return createDb(env.DB)
}

// ลูกค้าใหม่ (ไม่อยู่ใน data sheet) จองรอบ 13:00 พรุ่งนี้ (เหมือน gear-up-api)
export const newGuest = {
  date: "2026-11-17",
  slot: "13:00",
  service: "oil",
  customer: "คุณทดสอบ",
  phone: "089-000-0001",
  car: "Toyota Yaris Ativ",
  plate: "9กก-9999",
  carSize: "small" as const,
}
