# สถาปัตยกรรม: สามชั้นในหนึ่ง Repo

## สามชั้น (3 tiers) และที่ที่แต่ละชั้นรัน

```
Browser (มือถือลูกค้า, คอมคุณขวัญ)     Cloudflare Worker (workerd)              ที่เก็บข้อมูล
┌───────────────────────────┐    ┌────────────────────────────────┐    ┌──────────────────┐
│ Presentation              │    │ Application                    │    │ Data             │
│ HTML ของหน้าร้าน           │───▶│ middleware → Action / หน้าเว็บ │───▶│ D1  (SQLite)     │
│ React Islands ของหลังร้าน  │◀───│ → services → db                │◀───│ R2  (รูปบริการ)   │
└───────────────────────────┘    └────────────────────────────────┘    └──────────────────┘
```

ชั้น (tier) ไม่ใช่ Repo และไม่ใช่เครื่อง: ทั้งสามชั้นอยู่ใน Repo นี้ แต่รันคนละที่
หน้า `.astro` เขียนอยู่ข้าง ๆ Action แต่ HTML ที่ได้ไปแสดงใน Browser
ส่วน `src/components/admin/*.tsx` เป็นชั้นเดียวที่ JavaScript ของเราไปรันใน Browser จริง ๆ

## ชั้นในเซิร์ฟเวอร์: เทียบกับ gear-up-api (Express)

| gear-up-api (Express) | gear-up-app (Astro) | เปลี่ยนไหม |
| --- | --- | --- |
| `middleware/require-role.ts` | `src/middleware.ts` + `src/actions/guard.ts` | เขียนใหม่ (กติกาเดิม: 401 / 403) |
| `routes/*.ts` (Express Router) | `src/actions/*.ts` (Astro Actions) และ `src/pages/` | เขียนใหม่ (Zod ชุดเดิม) |
| `middleware/error-handler.ts` | `src/actions/errors.ts` | เขียนใหม่ (ชนิด → Status เดิม) |
| `services/` | `src/services/` | **ไฟล์เดียวกันทุกไบต์** |
| `rules/` | `src/rules/` | **ไฟล์เดียวกันทุกไบต์** |
| `db/` (Postgres บน Neon) | `src/db/` (D1) | **เขียนใหม่** ([postgres-vs-d1.md](postgres-vs-d1.md)) |
| `auth/` | `src/auth/` | ย้ายมา เปลี่ยนแค่ `database` |

## เส้นทางของการจองหนึ่งครั้ง

ลูกค้ากด "ยืนยันการจอง" ที่ `/book`

1. **Browser** ส่งฟอร์ม `POST /book?_action=booking.create` (ไม่มี JavaScript ก็ส่งได้)
2. **`src/middleware.ts`** ถาม Better Auth ว่าใครล็อกอิน (ลูกค้าไม่ได้ล็อกอิน: `user = null`)
   แล้วดูตาราง `ACTION_RULES` ชื่อ `booking.create` ไม่อยู่ในตาราง จึงผ่าน
3. **`src/actions/booking.ts`** Zod ตรวจฟอร์ม (เบอร์โทร, รอบ, ขนาดรถ) ผิดก็ตอบ Input Error ทันที
4. Action เรียก **`createBooking(getDb(), input, now())`** จาก `src/server/services.ts`
5. **service** (`src/services/create-booking.ts`) เช็กกฎของร้าน: มีบริการนี้ไหม มีรอบนี้ไหม ผ่านไปแล้วหรือยัง
   แล้วเรียก `insertBookingIfRoom` ของ **db** (`src/db/queries/booking-writes.ts`)
6. **db** ส่ง `INSERT ... SELECT ... WHERE (นับ) < bays` คำสั่งเดียวไปที่ **D1** ได้ 0 แถว = เต็ม → `{ status: "full" }`
7. service `throw` `ServiceError("conflict", "รอบนี้เต็มแล้ว")`
   → **`src/actions/errors.ts`** แปลงเป็น `ActionError` `CONFLICT` (409)
8. **`src/pages/book.astro`** อ่านผลด้วย `Astro.getActionResult` แล้ว Render ใบยืนยันพร้อมรหัส `GU-XXXX` หรือข้อความ 409

ฝั่งหลังร้านเหมือนกันทุกข้อ ต่างแค่ข้อ 1 (React เรียก `actions.board.setStatus(...)` แบบ RPC ด้วย `fetch`)
และข้อ 2-3 ที่ต้องผ่านด่านของพนักงานสองชั้น ([auth.md](auth.md))

## ทำไมหน้าร้านเป็น `output: "server"`

ราคาและช่องว่างเปลี่ยนทุกครั้งที่มีคนจองหรือคุณภูมิแก้ราคา จึง Render ตอนมีคำขอ
แต่หน้าร้านไม่ส่ง JavaScript ไปที่ Browser เลย (HTML + CSS ล้วน) เบาบนมือถือเหมือนหน้านิ่ง
JavaScript ที่ส่งไปมีแค่หน้า `/login` (Better Auth Client) และกระดานงาน (React)

## ทำไมรูปผ่าน Worker

`/photos/oil` อ่านจาก R2 ด้วย `env.BUCKET.get` และอัปโหลดด้วย `env.BUCKET.put` ใน Action
ไม่ใช้ Presigned URL เพราะรูปเล็ก (≤ 2 MB) และการเช็กสิทธิ์อยู่ที่ Action ที่เดียว
