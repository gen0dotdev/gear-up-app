# Postgres (gear-up-api) กับ D1 (gear-up-app): ตารางเดียวกัน สองฐานข้อมูล

ใช้ในบทเรียน the-map และ drizzle-d1: ตารางเดียวกัน ชื่อคอลัมน์เดียวกัน ข้อมูลตัวอย่างชุดเดียวกัน
ที่ต่างคือ "ชนิด" ที่แต่ละฐานข้อมูลมี และวิธีกันสองคำขอที่มาพร้อมกัน

| เรื่อง | Postgres (Neon / PGlite) | D1 (SQLite) | ทำไม |
| --- | --- | --- | --- |
| ประกาศตาราง | `pgTable` จาก `drizzle-orm/pg-core` | `sqliteTable` จาก `drizzle-orm/sqlite-core` | Drizzle แยกตามภาษา SQL ของแต่ละฐานข้อมูล |
| ต่อฐานข้อมูล | `createDb(url)` ด้วย `drizzle-orm/neon-serverless` | `createDb(env.DB)` ด้วย `drizzle-orm/d1` | D1 เป็น Binding ของ Worker ไม่มี URL หรือรหัสผ่าน |
| วันที่ `slots.day` | `date` (`mode: "string"`) | `text` เก็บ `"2026-11-17"` | SQLite ไม่มีชนิดวันที่ แบบ YYYY-MM-DD เรียงและเทียบเป็นข้อความได้ถูก |
| true / false | `boolean` | `integer` 0 / 1 | SQLite ไม่มีชนิด boolean (ตาราง Better Auth: `emailVerified`, `banned`) |
| id อัตโนมัติ `slots.id` | `serial` | `integer` + `primaryKey({ autoIncrement: true })` | ชื่อต่างกัน งานเดียวกัน |
| id แบบ B212, C18 | `DEFAULT 'B' \|\| nextval('booking_no')` (Sequence) | `MAX + 1` ใน INSERT คำสั่งเดียวกัน | SQLite ไม่มี Sequence และ DEFAULT ใช้ Subquery ไม่ได้ |
| ทักษะของช่าง `mechanics.services` | `text[]` (Array) | `text` แบบ JSON `["oil","check"]` | SQLite ไม่มี Array, Drizzle (`mode: "json"`) แปลงให้ |
| CHECK, UNIQUE, Foreign Key | มี | มี (D1 เปิด Foreign Key ไว้) | เขียนเหมือนเดิม |
| รถซ้ำในรอบ | Partial Unique Index `WHERE status <> 'cancelled'` | เหมือนกันทุกตัวอักษร | SQLite รองรับ Partial Index |
| ชน Unique | รหัส `23505` + ชื่อ Constraint | ข้อความ `UNIQUE constraint failed: bookings.slot_id, bookings.plate` | SQLite ไม่มีรหัสแยกชนิด จึงอ่านจากข้อความ (`db/errors.ts`) |
| หนึ่งเบอร์ = ลูกค้าหนึ่งคน | Unique `customers_phone_unique` + `.onConflictDoNothing({ target: customers.phone })` | Unique Index ชื่อเดียวกัน + `INSERT ... SELECT ... WHERE true ON CONFLICT (phone) DO NOTHING` | `INSERT ... SELECT` ของ SQLite ต้องมี `WHERE` ก่อน `ON CONFLICT` ไม่อย่างนั้น SQLite อ่าน `ON` เป็นส่วนของ JOIN |
| ไม่เกิน 4 คัน | Transaction + `SELECT ... FOR UPDATE` (คำขอที่สองรอ) | `INSERT ... SELECT ... WHERE (นับ) < bays` คำสั่งเดียว | D1 ไม่มี Transaction แบบเปิดค้างข้าม `await` และไม่มีการล็อกแถว |
| หลายคำสั่งพร้อมกัน | `db.transaction(async (tx) => ...)` | `db.batch([...])` ส่งเป็นชุด ทำทั้งชุดหรือไม่ทำเลย | Batch ส่งคำสั่งที่รู้ล่วงหน้า อ่านผลระหว่างทางไม่ได้ |
| Migration | `drizzle-kit migrate` | `drizzle-kit generate` แล้ว `wrangler d1 migrations apply` | Wrangler รู้จัก D1 ทั้งในเครื่องและบน Cloudflare |
| ฐานข้อมูลในเครื่อง | PGlite (Postgres ใน Node) | Wrangler / Miniflare (`.wrangler/state`) | ทั้งคู่ไม่ต้องมีบัญชีและไม่ต้องต่อเน็ต |
| Test | Vitest + PGlite ในหน่วยความจำ | Vitest + `@cloudflare/vitest-plugin` (รันใน workerd) | Test รันใน Runtime เดียวกับของจริง |

## ที่ไม่ต่าง (และนี่คือประเด็นของบทเรียน)

- `src/services/` และ `src/rules/` **ไฟล์เดียวกันทุกไบต์** (`diff -r` ไม่มีผลต่าง)
- `db/queries/bookings.ts`, `services.ts`, `mechanics.ts` ไฟล์เดียวกัน: Query Builder ของ Drizzle เขียนเหมือนกันทั้งสองฐานข้อมูล
- Test ของ `booking-writes` ไฟล์เดียวกัน ผ่านทั้งสองฐานข้อมูล

ชั้น (layer) ที่แยกดีทำให้เปลี่ยนฐานข้อมูลได้โดยแตะแค่ `db/` นั่นคือเหตุผลที่ services ไม่ import ฐานข้อมูลเอง
และไม่มี Transaction อยู่ใน services: "การรับประกันของฐานข้อมูล" อยู่ใน `db/queries/booking-writes.ts` ที่เดียว
