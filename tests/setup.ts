// ก่อนทุกไฟล์ Test: สร้างตาราง (migrations/ ชุดเดียวกับที่ Wrangler รัน)
// ก่อนทุก Test: ใส่ข้อมูลตัวอย่างใหม่ (seed/0001_sample.sql ลบข้อมูลร้านเก่าก่อนเสมอ)
// Test หนึ่งจองหรือยกเลิกไป จึงไม่กระทบ Test ถัดไป
import { applyD1Migrations } from "cloudflare:test"
import { env } from "cloudflare:workers"
import { beforeEach } from "vitest"

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)

beforeEach(async () => {
  const queries = env.TEST_SEED.flatMap((m) => m.queries)
  // batch = ส่งหลายคำสั่งไป D1 ในครั้งเดียว และทำทั้งชุดหรือไม่ทำเลย
  await env.DB.batch(queries.map((q) => env.DB.prepare(q)))
})
