# stage 2: ย้าย services และ rules มาจาก gear-up-api, เขียน db ใหม่สำหรับ D1 (เสร็จแล้ว)

บันทึกว่าทำอะไรไปบ้าง ใช้เป็นโครงของบทเรียน the-map, drizzle-d1 และ book-action

## ย้ายมาโดยไม่แก้

```bash
cp gear-up-api/src/services/* gear-up-app/src/services/
cp gear-up-api/src/rules/*    gear-up-app/src/rules/
diff -r gear-up-api/src/services gear-up-app/src/services   # ไม่มีผลต่าง
diff -r gear-up-api/src/rules    gear-up-app/src/rules      # ไม่มีผลต่าง
```

ทำได้เพราะ gear-up-api ย้าย "การรับประกันของฐานข้อมูล" (Transaction, `FOR UPDATE`) ออกจาก services
ไปไว้ใน `db/queries/booking-writes.ts` ก่อนแล้ว services เรียก `insertBookingIfRoom` / `moveBookingIfRoom`
และได้คำตอบ `ok` / `full` / `same-car` / `not-booked` โดยไม่รู้ว่าข้างในใช้วิธีไหน

## เขียนใหม่: `src/db/`

ดู `src/db/README.md` และ `docs/postgres-vs-d1.md`
ไฟล์ที่ต่าง: `schema.ts`, `index.ts`, `d1.ts`, `errors.ts`, `queries/booking-writes.ts`, `queries/customers.ts`, `queries/slots.ts`
ไฟล์ที่เหมือนเดิม: `queries/bookings.ts`, `queries/services.ts`, `queries/mechanics.ts`

## ต่อสาย

- `src/server/db.ts`: `getDb()` = `createDb(env.DB)` ทุกคำขอ
- `src/server/services.ts`: import จาก `src/services/*` และเช็กกับ `src/server/contract.ts` ด้วย `satisfies`
- ลบ `src/stub/` (ตัวจำลองในหน่วยความจำของ stage 1)

## ที่เจอระหว่างทาง

- **รถใหม่คันเดียวกันจองพร้อมกันสองคำขอ** (เช่น กดปุ่มจองสองครั้ง): ทั้งสองคำขออ่านว่า "ยังไม่มีรถคันนี้"
  แล้วต่างคนต่างเพิ่ม คำขอที่สองชน Primary Key ของ `cars` → 500 แทนที่จะได้ "รถคันนี้จองรอบนี้ไว้แล้ว"
  Test ใน workerd จับได้ แก้ใน `db/queries/customers.ts` ของ D1 ให้ "เพิ่มถ้ายังไม่มี" ในคำสั่งเดียว
  (`HAVING NOT EXISTS`, `onConflictDoNothing`) **gear-up-api มีจุดเดียวกัน** (`ensureCustomerCar` อยู่นอก Transaction แล้ว)
- ลองถอดเงื่อนไข `WHERE (นับ) < bays` ออกชั่วคราว: Test เรื่องรอบเต็มและการแย่งช่องพัง 4 ข้อ แปลว่าเงื่อนไขนี้คือตัวกันจริง
