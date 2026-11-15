// createDb(env.DB): Drizzle บน D1 (แทน neon.ts ของ gear-up-api)
// เรียกใหม่ทุกคำขอ (src/server/db.ts) เพราะ Binding ของ Cloudflare ใช้ได้ระหว่างคำขอ
// การสร้างแค่ห่อ Binding ไว้ ไม่ได้เปิด Connection ใหม่ จึงไม่เปลือง
import { drizzle } from "drizzle-orm/d1"
import { schema, type Db } from "./index.ts"

export function createDb(d1: D1Database): Db {
  return drizzle(d1, { schema })
}
