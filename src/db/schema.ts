// ตารางของ Gear Up ใน Drizzle สำหรับ D1 (SQLite)
// ตารางเดียวกับ gear-up-api ทุกตาราง ทุกคอลัมน์ ชื่อเดิม (services/ จึง import ใช้ได้โดยไม่แก้)
// ต่างกันแค่ "ชนิด" ที่ SQLite มี ดูตารางเทียบทั้งหมดใน docs/postgres-vs-d1.md
//
// ที่เปลี่ยนจาก Postgres และทำไม:
// - pgTable → sqliteTable, import จาก drizzle-orm/sqlite-core
// - date → text: SQLite ไม่มีชนิดวันที่ เก็บ "2026-11-17" เป็นข้อความ (เรียงและเทียบได้ถูกเพราะเป็น YYYY-MM-DD)
// - serial → integer primaryKey autoIncrement
// - text().array() (mechanics.services) → text แบบ JSON: SQLite ไม่มี Array, Drizzle แปลง JSON ↔ Array ให้
// - Sequence (B212, C18) → ไม่มีใน SQLite: id สร้างใน INSERT เดียวกับที่เขียนแถว ด้วย MAX + 1
//   (db/queries/booking-writes.ts และ customers.ts) คำสั่งเดียวใน D1 ไม่มีคำขออื่นแทรกกลางได้ เลขจึงไม่ซ้ำ
// - CHECK, UNIQUE, Foreign Key และ Partial Unique Index (WHERE status <> 'cancelled') SQLite มีครบ เขียนเหมือนเดิม
import { sql } from "drizzle-orm"
import { check, integer, sqliteTable, text, unique, uniqueIndex } from "drizzle-orm/sqlite-core"
import type { ServiceId } from "../rules/booking-rules.ts"

export const services = sqliteTable(
  "services",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    minutes: integer().notNull(),
    price: integer().notNull(),
    priceBig: integer("price_big").notNull(),
  },
  (t) => [
    check("services_minutes_positive", sql`${t.minutes} > 0`),
    check("services_price_positive", sql`${t.price} > 0`),
    check("services_price_big_positive", sql`${t.priceBig} > 0`),
  ],
)

export const mechanics = sqliteTable("mechanics", {
  id: text().primaryKey(),
  name: text().notNull(),
  // บริการที่ช่างคนนี้ทำได้ เก็บเป็นข้อความ JSON เช่น ["oil","check"] (Postgres ใช้ text[])
  services: text({ mode: "json" }).$type<ServiceId[]>().notNull().default(sql`'[]'`),
})

export const customers = sqliteTable("customers", {
  id: text().primaryKey(), // C01, C18, ...: สร้างใน db/queries/customers.ts (ไม่มี Sequence)
  name: text().notNull(),
  phone: text().notNull(),
})

export const cars = sqliteTable(
  "cars",
  {
    plate: text().primaryKey(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    model: text().notNull(),
    size: text({ enum: ["small", "big"] }).notNull(),
  },
  (t) => [check("cars_size", sql`${t.size} IN ('small', 'big')`)],
)

export const slots = sqliteTable(
  "slots",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    day: text().notNull(), // "2026-11-17"
    time: text().notNull(),
    bays: integer().notNull().default(4),
  },
  (t) => [unique("slots_day_time").on(t.day, t.time)],
)

export const bookings = sqliteTable(
  "bookings",
  {
    id: text().primaryKey(), // B212, ...: สร้างใน db/queries/booking-writes.ts (ไม่มี Sequence)
    code: text().notNull().unique(),
    slotId: integer("slot_id")
      .notNull()
      .references(() => slots.id),
    plate: text()
      .notNull()
      .references(() => cars.plate),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id),
    mechanicId: text("mechanic_id").references(() => mechanics.id),
    status: text({ enum: ["booked", "cancelled", "done"] })
      .notNull()
      .default("booked"),
    note: text(),
    // ราคาที่ตกลงตอนจอง: คุณภูมิขึ้นราคาทีหลัง การจองเดิมไม่เปลี่ยน
    price: integer().notNull(),
    // เบอร์ที่ลูกค้ากรอกตอนจอง ใช้คู่กับรหัสจองใน "การจองของฉัน"
    phone: text().notNull(),
  },
  (t) => [
    check("bookings_status", sql`${t.status} IN ('booked', 'cancelled', 'done')`),
    check("bookings_price_positive", sql`${t.price} > 0`),
    // "รถคันเดิมจองรอบเดียวกันซ้ำไม่ได้": Unique เฉพาะแถวที่ยังไม่ยกเลิก (Partial Index) เหมือน Postgres
    // ส่วน "ไม่เกิน 4 คัน" เป็น Constraint ไม่ได้ (ต้องนับหลายแถว) อยู่ใน db/queries/booking-writes.ts
    uniqueIndex("one_car_per_slot")
      .on(t.slotId, t.plate)
      .where(sql`${t.status} <> 'cancelled'`),
  ],
)
