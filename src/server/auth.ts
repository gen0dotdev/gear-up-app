// Better Auth ของคำขอนี้: สร้างใหม่ทุกคำขอ ด้วย D1 และค่าลับจาก env
// เรียกจาก middleware.ts และ src/pages/api/auth/[...all].ts
import { env } from "cloudflare:workers"
import { createAuth } from "../auth/auth.ts"

export function getAuth(request: Request) {
  // ไม่ได้ตั้ง BETTER_AUTH_URL ก็ใช้ Origin ของคำขอ (สะดวกตอนลองในเครื่องคนละพอร์ต)
  // บนเซิร์ฟเวอร์จริงควรตั้งให้ชัด
  const baseURL = env.BETTER_AUTH_URL || new URL(request.url).origin
  if (!env.BETTER_AUTH_SECRET) throw new Error("ยังไม่ได้ตั้ง BETTER_AUTH_SECRET (คัดลอก .dev.vars.example เป็น .dev.vars)")
  return createAuth(env.DB, { secret: env.BETTER_AUTH_SECRET, baseURL })
}
