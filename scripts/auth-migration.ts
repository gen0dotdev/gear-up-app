// สร้าง migrations/0000_auth.sql: ตารางของ Better Auth (user, session, account, verification)
//   node scripts/auth-migration.ts
// ใช้ค่าตั้งชุดเดียวกับแอป (authOptions) กับ SQLite ในหน่วยความจำ แล้วให้ Better Auth บอก SQL ที่ต้องรัน
// D1 คือ SQLite ไฟล์ SQL นี้จึงรันบน D1 ได้ตรง ๆ ด้วย npm run db:migrate:local
// ไฟล์นี้ลงทะเบียนเป็น Custom Migration ของ drizzle-kit (generate --custom) จึงเรียงก่อนตารางของร้าน
// รันใหม่เฉพาะตอนเปลี่ยน Plugin ของ Better Auth (แล้วสร้าง Custom Migration ไฟล์ใหม่ อย่าแก้ไฟล์ที่ apply ไปแล้ว)
import { writeFileSync } from "node:fs"
import { DatabaseSync } from "node:sqlite"
import { getMigrations } from "better-auth/db/migration"
import { authOptions } from "../src/auth/auth.ts"

const options = authOptions(null as never, { secret: "x".repeat(32), baseURL: "http://localhost" })
const { compileMigrations } = await getMigrations({ ...options, database: new DatabaseSync(":memory:") })
const sql = await compileMigrations()

const header = "-- ตารางของ Better Auth: สร้างด้วย node scripts/auth-migration.ts (ห้ามแก้มือ)\n"
writeFileSync("migrations/0000_auth.sql", header + sql.trim() + "\n")
console.log("เขียน migrations/0000_auth.sql แล้ว")
