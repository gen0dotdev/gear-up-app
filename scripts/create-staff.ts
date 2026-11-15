// npm run staff:local: สร้างบัญชีคุณภูมิ (admin) และคุณขวัญ (staff) ใน D1 ในเครื่อง
// แนวเดียวกับ npm run staff ของ gear-up-api: เรียก auth.api.createUser ของ Admin Plugin
// ซึ่งสร้างบัญชีได้แม้ปิดหน้าสมัคร (disableSignUp) เพราะเรียกจากฝั่งเซิร์ฟเวอร์ ไม่ผ่าน HTTP
//
// getPlatformProxy ของ Wrangler ให้ env.DB ตัวเดียวกับที่ npm run dev ใช้ (.wrangler/state)
// ต้องรัน npm run db:migrate:local ก่อน (ตาราง user ต้องมีแล้ว)
// รหัสผ่านอยู่ใน src/auth/staff.ts ใช้ได้เฉพาะในเครื่อง
import { getPlatformProxy } from "wrangler"
import { createAuth } from "../src/auth/auth.ts"
import { createStaffAccount, DEV_STAFF } from "../src/auth/staff.ts"

const { env, dispose } = await getPlatformProxy<Env>()
const auth = createAuth(env.DB, { secret: env.BETTER_AUTH_SECRET, baseURL: env.BETTER_AUTH_URL || "http://localhost:4400" })

for (const account of DEV_STAFF) {
  const started = performance.now()
  try {
    await createStaffAccount(auth, account)
    const ms = Math.round(performance.now() - started)
    console.log(`สร้าง ${account.name} ${account.email} Role ${account.role} รหัส ${account.password} (${ms} ms)`)
  } catch (error) {
    // มีบัญชีอยู่แล้ว (รันซ้ำ) ไม่เป็นไร ข้ามไป
    const message = error instanceof Error ? error.message : String(error)
    console.log(`${account.email}: ข้าม (${message})`)
  }
}
await dispose()
