# gear-up-app (งานที่เสร็จแล้วของ gen0)

เว็บแอปของศูนย์บริการรถยนต์ Gear Up ครบในหนึ่ง Repo: หน้าร้านให้ลูกค้าจองคิว หลังร้านให้พนักงานล็อกอินดูกระดานงาน
และให้คุณภูมิแก้ราคาและอัปโหลดรูป รันบน Cloudflare Workers + D1 + R2
นี่คือ exemplar ของคอร์สสุดท้ายในเส้นทาง Coding (**fullstack-astro**) ข้อมูลทั้งหมดเป็นข้อมูลตัวอย่าง ไม่มีข้อมูลลูกค้าจริง

> **บทเรียนหลักของ Repo นี้:** `src/services/` และ `src/rules/` เป็นไฟล์เดียวกับ **gear-up-api** (คอร์ส backend-express)
> **ทุกไบต์** ส่วน `src/db/` เขียนใหม่จาก Postgres เป็น D1 ชั้นเดียว
> ดู [docs/postgres-vs-d1.md](docs/postgres-vs-d1.md) และ [docs/stage-2.md](docs/stage-2.md)

Astro 7 · Cloudflare adapter 14 · React 19 · TanStack Query 5 · shadcn/ui · Tailwind CSS 4 · Better Auth 1.7 · Zod 4 · TypeScript strict

## รันในเครื่อง (ไม่ต้องมีบัญชี Cloudflare)

ต้องมี Node.js 22.23 ขึ้นไป (แนะนำ 24)

```bash
npm install
cp .dev.vars.example .dev.vars   # Mac: ค่าลับสำหรับเครื่องเรา (ไม่ขึ้น GitHub)
                                 # Windows (PowerShell): copy .dev.vars.example .dev.vars
npm run setup:local              # D1 ในเครื่อง: สร้างตาราง + ข้อมูลตัวอย่าง + บัญชีพนักงานสองคน
npm run dev                      # เปิด http://localhost:4400
```

`npm run dev` รันแอปใน **workerd** (ตัวเดียวกับบน Cloudflare) ผ่าน Cloudflare Vite Plugin
D1 และ R2 จำลองอยู่ในโฟลเดอร์ `.wrangler/state` Astro 7 รัน dev แบบเบื้องหลัง: หยุดด้วย `npx astro dev stop`

### บัญชีสำหรับลองในเครื่อง

| อีเมล | รหัสผ่าน | Role | ทำอะไรได้ |
| --- | --- | --- | --- |
| `phum@gearup.example` | `gearup-phum-dev` | `admin` | ทุกอย่าง + บริการ ราคา รูป (`/admin/services`) |
| `kwan@gearup.example` | `gearup-kwan-dev` | `staff` | กระดานงาน: ปิดงาน ยกเลิก ย้ายรอบ มอบหมายช่าง |

รหัสผ่านชุดนี้อยู่บน GitHub ใครก็เห็น **ใช้ได้เฉพาะในเครื่อง** (ชุดเดียวกับ gear-up-api)
ไม่มีหน้าสมัครสมาชิก (`disableSignUp: true`) ลูกค้าจองแบบ Guest และได้รหัสจอง `GU-XXXX`

### ลองตามข้อมูลตัวอย่าง

`.dev.vars` ตั้ง `NOW=2026-11-16T18:00:00+07:00` แอปจึงคิดว่าตอนนี้เป็นเย็นวันจันทร์ 16 พ.ย. 2026 และหน้าร้านแสดงรอบของวันอังคาร 17 พ.ย.

- หน้าแรก: 09:00 เหลือช่องสุดท้าย · 11:00 เต็มแล้ว · 13:00 เหลือ 3 ช่อง · 15:00 เหลือ 2 ช่อง
- จองรอบ 11:00 → "รอบนี้เต็มแล้ว" (409) · จองทะเบียน `1กข-1234` รอบ 09:00 → "รถคันนี้จองรอบนี้ไว้แล้ว" (409)
- การจองของฉัน: `GU-7K2P` + `081-234-1001` (คุณปอนด์, B201)

## คำสั่ง

| คำสั่ง | ทำอะไร |
| --- | --- |
| `npm run dev` | รันในเครื่องที่พอร์ต 4400 |
| `npm run build` | สร้างไฟล์สำหรับ Deploy ใน `dist/` |
| `npm run preview` | รันไฟล์ที่ Build แล้วใน workerd (พอร์ต 4401) |
| `npm run typecheck` | `wrangler types` (Type ของ Binding) แล้ว `astro check` (TypeScript strict ทั้ง `.ts`, `.tsx`, `.astro`) |
| `npm test` | Test ใน workerd กับ D1 ในหน่วยความจำ (`tests/`: booking-writes, services, mechanics, rules) |
| `npm run db:generate` | แก้ `src/db/schema.ts` แล้วสร้าง Migration ใหม่ใน `migrations/` (drizzle-kit) |
| `npm run db:migrate:local` | รัน Migration ใน `migrations/` บน D1 ในเครื่อง (ตาราง Login + ตารางร้าน) |
| `npm run db:seed:local` | ใส่ข้อมูลตัวอย่าง 16-17 พ.ย. ใหม่ (ลบการจองที่ลองไว้ทิ้ง รันซ้ำได้) |
| `npm run staff:local` | สร้างบัญชีคุณภูมิและคุณขวัญใน D1 ในเครื่อง |
| `npm run setup:local` | สามคำสั่งบนรวมกัน |
| `npm run auth:migration` | สร้าง `migrations/0000_auth.sql` ใหม่จากค่าตั้งของ Better Auth (ใช้เมื่อเปลี่ยน Plugin) |

## แผนที่ของโค้ด: ชั้นไหนอยู่โฟลเดอร์ไหน

สามชั้น (3 tiers) อยู่ใน Repo เดียว แต่ละชั้นมีที่ของมันเอง ภาพเต็มและเส้นทางของหนึ่งคำขออยู่ที่ [docs/architecture.md](docs/architecture.md)

| ชั้น | โฟลเดอร์ | งาน | บทเรียน |
| --- | --- | --- | --- |
| Presentation (Browser) | `src/pages/*.astro`, `src/components/store/`, `src/layouts/` | หน้าร้าน: HTML จากเซิร์ฟเวอร์ ไม่มี JavaScript | storefront-pages |
| Presentation (Browser) | `src/components/admin/` (React Islands), `src/components/ui/` (shadcn) | กระดานงานของคุณขวัญ | admin-islands |
| Routes | `src/actions/` | Action = Route ของ Express ในรูป Astro: Zod ตรวจ Input แล้วเรียก service | book-action, my-booking |
| Routes | `src/pages/api/auth/[...all].ts`, `src/pages/photos/[id].ts` | Endpoint: Better Auth และรูปจาก R2 | better-auth-astro, r2-upload |
| ด่านตรวจ | `src/middleware.ts`, `src/actions/guard.ts`, `src/auth/access.ts` | ใครเข้าหน้าไหน เรียก Action ไหนได้ | middleware-guard, ai-action-check |
| Login | `src/auth/` | Better Auth (อีเมล + รหัสผ่าน, Role `admin` / `staff`) บน D1 | better-auth-astro |
| Services (กฎของร้าน) | `src/services/`, `src/rules/` | **ไฟล์เดียวกับ gear-up-api ทุกไบต์** (`diff -r` ไม่มีผลต่าง) | the-map |
| Data access | `src/db/`, `migrations/`, `seed/` | **เขียนใหม่สำหรับ D1** ชั้นเดียวที่เปลี่ยน: `sqliteTable`, `createDb(env.DB)`, กันรอบเกินด้วย SQL คำสั่งเดียว | drizzle-d1, book-action |
| Tests | `tests/` | Test ของ gear-up-api ที่ใช้ฐานข้อมูล รันใน workerd กับ D1 | book-action |
| Files | `src/files/` | ตรวจและเก็บรูปใน R2 | r2-upload |
| Wiring | `src/server/` | หยิบ `env` ของ Cloudflare มาประกอบ: `getDb()`, `getAuth()`, `now()` และรายชื่อ services ที่แอปใช้ (`contract.ts`) | the-map |
| ตั้งค่า | `astro.config.mjs`, `wrangler.jsonc`, `.dev.vars.example`, `tsconfig.json` | Astro + Cloudflare + React + Tailwind, Binding `DB` และ `BUCKET` | new-project, deploy |

กติกาที่ทำให้ชั้นแยกกันได้จริง:

1. **หน้าเว็บและ Action ไม่รู้ว่าข้อมูลอยู่ที่ไหน** เรียกแค่ฟังก์ชันจาก `src/server/services.ts`
2. **services ไม่รู้จัก Astro หรือ HTTP** ทำไม่ได้ก็ `throw` `ServiceError` แล้ว `src/actions/errors.ts` แปลงเป็น 404 / 409 / 400
3. **`import { env } from "cloudflare:workers"` มีแค่ใน `src/server/`, `src/actions/catalog.ts` และ `src/pages/photos/`** โค้ดที่เหลือไม่ผูกกับ Cloudflare
   (`src/db/` รับ D1 เป็นพารามิเตอร์ `createDb(d1)` ไม่ import `env` เอง)
4. **Action ของพนักงานทุกตัวเช็กสิทธิ์เอง** ดู [docs/auth.md](docs/auth.md)

## ขึ้น Cloudflare (ยังไม่ได้ทำ)

คำสั่งของฐานข้อมูลบน Cloudflare (บทเรียน deploy ยังไม่ได้รันใน Repo นี้):

```bash
npx wrangler d1 create gear-up                                     # ได้ database_id ไปใส่ใน wrangler.jsonc
npx wrangler d1 migrations apply DB --remote                       # สร้างตาราง
npx wrangler d1 execute DB --remote --file seed/0001_sample.sql    # ข้อมูลตัวอย่าง (ถ้าต้องการ)
npx wrangler r2 bucket create gear-up-photos
npx wrangler secret put BETTER_AUTH_SECRET
```


ต้องใช้ **Workers Paid (5 USD/เดือน)**: การตรวจรหัสผ่านของ Better Auth ใช้ CPU ราว 30 ms ต่อครั้ง (วัดในเครื่อง)
เกิน 10 ms ของแผนฟรี (รายละเอียดใน [docs/auth.md](docs/auth.md)) D1 และ R2 ใช้แผนฟรีได้
ขั้นตอน Deploy (สร้าง D1 / R2 จริง, `wrangler secret put`, `wrangler deploy`) อยู่ในบทเรียน deploy

### บัญชีพนักงานบน Cloudflare

`npm run staff:local` สร้างบัญชีใน D1 บนเครื่องเท่านั้น และรหัส `gearup-phum-dev` / `gearup-kwan-dev` อยู่บน GitHub ใครก็เห็น
ห้ามส่งบัญชีที่ยังใช้รหัสนี้ขึ้นไป ให้เปลี่ยนรหัสบนเครื่องก่อน แล้วค่อยส่งเฉพาะตารางบัญชีขึ้น D1 บน Cloudflare

1. `npm run dev` แล้วล็อกอินเป็นคุณภูมิที่ `http://localhost:4400/login`
2. เปิด Console ของ DevTools (`Cmd + Option + J` บน Mac หรือ `Ctrl + Shift + J` บน Windows) แล้ววางบรรทัดนี้
   โดยเปลี่ยน `รหัสใหม่ของคุณภูมิ` เป็นรหัสยาวที่จดไว้ในที่ปลอดภัย

   ```js
   await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: "gearup-phum-dev", newPassword: "รหัสใหม่ของคุณภูมิ", revokeOtherSessions: true }) }).then((r) => r.status)
   ```

3. ได้ `200` แล้วออกจากระบบ ล็อกอินเป็นคุณขวัญ ทำซ้ำด้วย `gearup-kwan-dev`
4. ส่งออกตารางบัญชีจาก D1 บนเครื่อง แล้วส่งเข้า D1 บน Cloudflare

   ```bash
   npx wrangler d1 export DB --local --table user --table account --no-schema --output staff.sql
   npx wrangler d1 execute DB --remote --file staff.sql
   ```

5. ลบ `staff.sql` ทันที (ไฟล์นี้มีรหัสผ่านที่ Hash แล้ว): Mac `rm staff.sql` · Windows `del staff.sql`

ขั้นตอนนี้ทดสอบกับ D1 บนเครื่องแล้ว ส่วนคำสั่ง `--remote` ยังไม่ได้รันกับบัญชี Cloudflare จริง

## เอกสาร

- [docs/architecture.md](docs/architecture.md) สามชั้น, ชั้นในเซิร์ฟเวอร์ และเส้นทางของการจองหนึ่งครั้ง
- [docs/auth.md](docs/auth.md) ล็อกอิน, Role และด่านตรวจสองชั้นของหน้าเว็บและ Action
- [docs/postgres-vs-d1.md](docs/postgres-vs-d1.md) ตารางเทียบ Postgres กับ D1 สำหรับบทเรียน drizzle-d1
- [docs/stage-2.md](docs/stage-2.md) บันทึกการย้าย services / rules มาจาก gear-up-api และเขียน db ใหม่สำหรับ D1
- [docs/screenshots/](docs/screenshots/) ภาพหน้าจอที่จอมือถือ (390px) และเดสก์ท็อป
