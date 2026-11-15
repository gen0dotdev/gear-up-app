// ตั้งค่า Better Auth: ล็อกอินด้วยอีเมล + รหัสผ่าน, Session เก็บใน D1, Role admin/staff
// ย้ายมาจาก gear-up-api (src/auth/auth.ts) ต่างกันบรรทัดเดียว: database
//   Express: drizzleAdapter(db, { provider: "pg", schema })  (Postgres ผ่าน Drizzle)
//   Astro:   database: d1                                     (Better Auth คุยกับ D1 เองได้)
import { betterAuth, type BetterAuthOptions } from "better-auth"
import { admin as adminPlugin } from "better-auth/plugins"
import { ac, roles } from "./permissions.ts"

export type AuthOptions = {
  secret: string // ใช้เซ็น Cookie ของ Session: อยู่ใน .dev.vars / wrangler secret เท่านั้น
  baseURL: string // URL ของแอป เช่น http://localhost:4400
}

// ค่าตั้งของ Better Auth แยกเป็นฟังก์ชัน เพราะ scripts/auth-migration.ts ใช้ชุดเดียวกัน
// สร้างไฟล์ SQL ของตาราง Login (ตารางจึงตรงกับ Plugin ที่เปิดไว้เสมอ)
export function authOptions(d1: D1Database, options: AuthOptions) {
  return {
    secret: options.secret,
    baseURL: options.baseURL,
    database: d1,
    emailAndPassword: {
      enabled: true,
      // ร้านนี้ไม่มีหน้าสมัครสมาชิก ลูกค้าจองแบบ Guest
      // บัญชีพนักงานสร้างโดยคุณภูมิ (Admin) หรือสคริปต์ npm run staff:local เท่านั้น
      disableSignUp: true,
    },
    plugins: [
      adminPlugin({
        ac,
        roles,
        defaultRole: "staff",
        adminRoles: ["admin"],
      }),
    ],
  } satisfies BetterAuthOptions
}

// รับ D1 เป็นพารามิเตอร์ และถูกเรียกใหม่ทุกคำขอ (src/server/auth.ts)
// เพราะบน Workers Binding อย่าง env.DB ใช้ได้ระหว่างคำขอ คู่มือ Better Auth จึงให้สร้างต่อคำขอ
// ไม่สร้างครั้งเดียวไว้นอกฟังก์ชันแล้วใช้ซ้ำ
export function createAuth(d1: D1Database, options: AuthOptions) {
  return betterAuth(authOptions(d1, options))
}

export type Auth = ReturnType<typeof createAuth>
export type AuthSession = Auth["$Infer"]["Session"]
