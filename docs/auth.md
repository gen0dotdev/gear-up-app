# ล็อกอินและด่านตรวจ

## Authentication กับ Authorization

- **Authentication** (คุณคือใคร): Better Auth อ่าน Cookie → หา Session ในตาราง `session` ของ D1 → ได้ `user`
  ทำใน `src/middleware.ts` ทุกคำขอ แล้วใส่ไว้ที่ `Astro.locals.user` / `context.locals.user` (Type ใน `src/env.d.ts`)
- **Authorization** (คุณทำสิ่งนี้ได้ไหม): `can(role, permission)` ใน `src/auth/access.ts`
  ใช้ตารางสิทธิ์ของ `src/auth/permissions.ts` (ยกมาจาก gear-up-api ทั้งไฟล์)

| Role | ใคร | สิทธิ์ |
| --- | --- | --- |
| `staff` | คุณขวัญ | `booking: read, update` กระดานงาน |
| `admin` | คุณภูมิ | ทุกอย่างของ staff + `service: update` + จัดการบัญชีพนักงาน |

## ด่านสองชั้น

Action คือ Endpoint (`POST /_actions/board.setStatus`) **ใครก็เรียกตรงได้** ด้วย `fetch` หรือ `curl`
โดยไม่ต้องเปิดหน้า `/admin` เลย การล็อกหน้าเว็บอย่างเดียวจึงเหมือนล็อกประตูหน้าร้านแต่เปิดประตูหลังไว้
(บทเรียน **ai-action-check**: AI มักเขียน middleware ที่กันแค่ `/admin` แล้วลืม Action)

| ชั้น | ที่ไหน | กันอะไร |
| --- | --- | --- |
| 1. middleware | `src/middleware.ts` อ่าน `PAGE_RULES` และ `ACTION_RULES` ใน `src/auth/access.ts` | หน้า `/admin*` (ไม่ล็อกอิน → ไป `/login`, Role ไม่พอ → 403) และ Action กลุ่ม `board.*`, `catalog.*` (401 / 403 โดย Action ไม่ได้รันเลย) |
| 2. ใน Action เอง | บรรทัดแรกของทุก handler: `requireStaff(context)` หรือ `requireAdmin(context)` (`src/actions/guard.ts`) | Action ทุกตัวของพนักงาน แม้ middleware จะพลาด |

สองชั้นใช้ `can()` ตัวเดียวกัน กฎจึงไม่มีสองที่ที่ตอบไม่ตรงกัน
ลองแล้ว: ลบ `ACTION_RULES` ทิ้งชั่วคราว `board.list` ที่ไม่ได้ล็อกอินยังได้ 401 จาก `requireStaff`

**กติกาเวลาเพิ่ม Action ใหม่ของพนักงาน** (เขียนไว้หัว `src/actions/index.ts` ด้วย)

1. ใส่ในกลุ่ม `board` หรือ `catalog` (หรือเพิ่มกลุ่มใหม่ใน `ACTION_RULES`)
2. บรรทัดแรกของ handler เรียก `requireStaff(context)` หรือ `requireAdmin(context)`
3. ลองเรียกตรงโดยไม่ล็อกอิน ต้องได้ 401 และล็อกอินเป็น staff เรียก Action ของ admin ต้องได้ 403

```bash
curl -X POST http://localhost:4400/_actions/board.list -H 'Content-Type: application/json' -d '{"date":"2026-11-17"}'
# {"type":"AstroActionError","code":"UNAUTHORIZED","status":401,"message":"กรุณาล็อกอินก่อน"}
```

การซ่อนปุ่มในหน้าเว็บ (เช่น เมนู "บริการและราคา" ที่คุณขวัญไม่เห็น) เป็นแค่ความสะดวก ไม่ใช่ด่าน

## Better Auth บน Workers + D1

- `src/auth/auth.ts`: `createAuth(env.DB, ...)` ส่ง D1 ให้ Better Auth ตรง ๆ (`database: d1`) ไม่ต้องมี Drizzle Adapter
  เทียบกับ gear-up-api ที่ใช้ `drizzleAdapter(db, { provider: "pg" })` ต่างกันบรรทัดเดียว
- **สร้างใหม่ทุกคำขอ** (`src/server/auth.ts`) เพราะ Binding อย่าง `env.DB` ใช้ได้ระหว่างคำขอ อย่าเก็บไว้ข้ามคำขอ
- `src/pages/api/auth/[...all].ts` ส่งทุก URL ใต้ `/api/auth/` ให้ Better Auth (`auth.handler(request)`)
- `emailAndPassword.disableSignUp: true`: `POST /api/auth/sign-up/email` ได้ 400 เสมอ
  บัญชีสร้างด้วย `npm run staff:local` (เรียก `auth.api.createUser` ของ Admin Plugin ฝั่งเซิร์ฟเวอร์)
- ตารางของ Better Auth: `migrations/0000_auth.sql` สร้างด้วย `npm run auth:migration` จากค่าตั้งชุดเดียวกับแอป

## เวลาตรวจรหัสผ่าน (คำถามเรื่อง Workers Paid)

วัดใน workerd บนเครื่อง (Mac, `npm run dev`) วันที่ 15 พ.ย. 2026:

| คำขอ | เวลารวม |
| --- | --- |
| หน้าแรก (ไม่มีรหัสผ่าน) | ประมาณ 10 ms |
| `POST /api/auth/sign-in/email` (ถูก) | 37-43 ms |
| `POST /api/auth/sign-in/email` (ผิด) | ประมาณ 48 ms |

ส่วนต่างราว 30 ms คือการ Hash ด้วย scrypt (เป็น CPU ล้วน) ซึ่งเกิน 10 ms ของแผนฟรีของ Workers
**สรุป: แอปที่ออนไลน์ต้องใช้ Workers Paid** ตามที่ spec ตั้งไว้ (ในเครื่องไม่มีเพดาน CPU จึงยังไม่เห็นว่าโดนตัด
ต้องยืนยันอีกครั้งบน Cloudflare จริงตอนบทเรียน deploy)
