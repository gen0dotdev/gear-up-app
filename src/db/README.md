# db/ ชั้นข้อมูล (Data Access) บน D1

**ชั้นเดียวที่เขียนใหม่** ตอนย้ายจาก gear-up-api (Postgres บน Neon) มาเป็น Astro บน Cloudflare (D1 / SQLite)
ชื่อไฟล์ ชื่อฟังก์ชัน และ Type ที่ `services/` import ยังเหมือนเดิมทุกตัว `services/` จึงย้ายมาโดยไม่แก้แม้แต่ไบต์เดียว

| ไฟล์ | งาน | เทียบกับ gear-up-api |
| --- | --- | --- |
| `schema.ts` | ตารางของร้านใน `sqliteTable` | **เขียนใหม่**: ชนิดคอลัมน์ของ SQLite (ดู `docs/postgres-vs-d1.md`) |
| `index.ts` | `schema` และ Type `Db` (`DrizzleD1Database`) | เขียนใหม่ (เดิม `PgDatabase`) |
| `d1.ts` | `createDb(env.DB)` ด้วย `drizzle-orm/d1` สร้างใหม่ทุกคำขอ | แทน `neon.ts`, `pglite.ts`, `open.ts` |
| `errors.ts` | `isUniqueViolation`: อ่านข้อความ `UNIQUE constraint failed: ...` ของ SQLite | **เขียนใหม่** (เดิมรหัส `23505` ของ Postgres) |
| `queries/booking-writes.ts` | `insertBookingIfRoom`, `moveBookingIfRoom`: กัน "เกิน 4 คัน" ด้วย SQL คำสั่งเดียว | **เขียนใหม่** (เดิม Transaction + `FOR UPDATE`) |
| `queries/customers.ts` | ลูกค้าและรถของการจองแบบ Guest | แก้: id ใหม่ด้วย `MAX + 1` ใน INSERT เดียวกับ `ON CONFLICT (phone) DO NOTHING` |
| `queries/slots.ts` | `slotsOn`, `findSlot` | แก้: ตัด `lockSlot`, `lockSlotById` (D1 ไม่มีการล็อกแถว) |
| `queries/bookings.ts` | อ่านการจอง (Join 5 ตาราง) | **ไม่แก้** ไฟล์เดียวกับ gear-up-api |
| `queries/services.ts` | ตาราง services | **ไม่แก้** |
| `queries/mechanics.ts` | ช่างและการมอบหมายช่าง | **ไม่แก้** |

สามไฟล์ล่างใช้แค่ Query Builder ของ Drizzle (`select`, `update ... returning`, `join`) ซึ่งเขียนเหมือนกันทั้ง Postgres และ SQLite
นี่คือสิ่งที่ ORM ช่วย: ส่วนที่ต่างกันจริงถูกขังไว้ในไม่กี่ไฟล์

## กัน "รอบเกิน 4 คัน" บน D1 อย่างไร

D1 ไม่มี Transaction แบบเปิดค้างข้ามหลาย `await` และไม่มี `SELECT ... FOR UPDATE`
จึงรวม "นับ" กับ "เขียน" ไว้ใน SQL คำสั่งเดียว (SQLite ทำคำสั่งเดียวจนจบก่อนเริ่มคำสั่งถัดไป):

```sql
INSERT INTO bookings (id, code, slot_id, plate, service_id, price, phone)
SELECT 'B' || (MAX + 1), ...
WHERE (SELECT count(*) FROM bookings WHERE slot_id = ? AND status <> 'cancelled')
      < (SELECT bays FROM slots WHERE id = ?)
RETURNING id
```

ได้ 0 แถว = เต็ม (หรือรถคันนี้อยู่ในรอบแล้ว อ่านดูอีกครั้งเพื่อเลือกข้อความ) ชน Unique Index `one_car_per_slot` = รถซ้ำ
การย้ายรอบเป็น `UPDATE ... WHERE` แบบเดียวกัน Test: `tests/booking-writes.test.ts` (ยกมาจาก gear-up-api ทั้งไฟล์)
และ `tests/services.test.ts` (สองคนแย่งช่องสุดท้าย, ห้าคนแย่งสามช่อง)

## Migration และข้อมูลตัวอย่าง

| คำสั่ง | ทำอะไร |
| --- | --- |
| `npm run db:generate` | แก้ `schema.ts` แล้วสร้างไฟล์ SQL ใหม่ใน `migrations/` (drizzle-kit) |
| `npm run db:migrate:local` | รัน `migrations/` กับ D1 ในเครื่อง (Wrangler) |
| `npm run db:seed:local` | ใส่ข้อมูลตัวอย่าง `seed/0001_sample.sql` (ลบข้อมูลร้านเดิมก่อน รันซ้ำได้) |
| `npx wrangler d1 migrations apply DB --remote` | รัน Migration กับ D1 บน Cloudflare (ตอน Deploy ยังไม่ได้รัน) |
| `npx wrangler d1 execute DB --remote --file seed/0001_sample.sql` | ใส่ข้อมูลตัวอย่างบน Cloudflare (ถ้าต้องการ ยังไม่ได้รัน) |

- `migrations/0000_auth.sql` ตารางของ Better Auth (`npm run auth:migration`, ลงทะเบียนเป็น Custom Migration ของ drizzle-kit)
- `migrations/0001_shop.sql` ตารางของร้าน (`drizzle-kit generate` จาก `schema.ts`)
- `migrations/0002_one_customer_per_phone.sql` Unique Index `customers_phone_unique`: หนึ่งเบอร์ = ลูกค้าหนึ่งคน
  (`drizzle-kit generate --name one_customer_per_phone`)
- `seed/0001_sample.sql` สร้างจาก `dataset.py` ของ gen0 ด้วย `tools/seed_from_dataset.py` (ห้ามแก้มือ)
  รหัสจองชุดเดียวกับ gear-up-api (B201 = GU-7K2P)
