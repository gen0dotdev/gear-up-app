// drizzle-kit: อ่าน src/db/schema.ts แล้วสร้างไฟล์ SQL (Migration) ใน migrations/
//   npx drizzle-kit generate --name <ชื่อ>
// แล้วรันกับ D1 ด้วย Wrangler (ไม่ใช้ drizzle-kit migrate):
//   npm run db:migrate:local                         D1 ในเครื่อง
//   npx wrangler d1 migrations apply DB --remote     D1 บน Cloudflare (ตอน Deploy)
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./migrations",
})
