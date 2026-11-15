// Type ของ Astro.locals (และ context.locals ใน Action): middleware.ts ใส่ค่าให้ทุกคำขอ
// Type ของ env (DB, BUCKET, ค่าลับ) มาจาก worker-configuration.d.ts ที่ npm run typecheck สร้างด้วย wrangler types
type AuthSession = import("./auth/auth.ts").AuthSession

declare namespace App {
  interface Locals {
    user: AuthSession["user"] | null // null = ยังไม่ได้ล็อกอิน (ลูกค้าทั่วไป)
    session: AuthSession["session"] | null
  }
}
