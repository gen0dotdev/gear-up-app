// "ตอนนี้กี่โมง" มาจากที่เดียว (แนวเดียวกับ clock.ts ของ gear-up-api)
// ข้อมูลตัวอย่างเป็นวันที่ 16-17 พ.ย. 2026: ตั้ง NOW ใน .dev.vars ให้แอปคิดว่าตอนนี้เป็นเย็นวันจันทร์
// บนเซิร์ฟเวอร์จริงไม่ตั้ง NOW แอปจึงใช้เวลาจริง
import { env } from "cloudflare:workers"

export function now(): Date {
  if (!env.NOW) return new Date()
  const at = new Date(env.NOW)
  if (Number.isNaN(at.getTime())) throw new Error(`NOW ไม่ใช่วันเวลาที่ถูกต้อง: ${env.NOW}`)
  return at
}
