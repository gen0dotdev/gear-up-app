// Better Auth ฝั่ง Browser: ใช้ในหน้า /login และปุ่มออกจากระบบ
// เรียก /api/auth/* ของแอปเดียวกัน จึงไม่ต้องตั้ง baseURL
import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient()
