// บัญชีพนักงานสองคนของ data sheet (ใช้ใน npm run staff:local)
// ยกมาจาก gear-up-api (src/auth/staff.ts) ทั้งไฟล์ รหัสผ่านชุดเดียวกัน
import type { Auth } from "./auth.ts"
import type { RoleName } from "./permissions.ts"

type StaffAccount = { email: string; name: string; role: RoleName; password: string }

// รหัสผ่านสำหรับลองในเครื่องเท่านั้น: อยู่ใน README และบน GitHub ใครก็เห็น
export const DEV_STAFF: StaffAccount[] = [
  { email: "phum@gearup.example", name: "คุณภูมิ", role: "admin", password: "gearup-phum-dev" },
  { email: "kwan@gearup.example", name: "คุณขวัญ", role: "staff", password: "gearup-kwan-dev" },
]

// createUser ของ Admin Plugin สร้างบัญชีได้แม้ปิดหน้าสมัคร (disableSignUp)
// เรียกจากฝั่งเซิร์ฟเวอร์โดยไม่ส่ง headers จึงไม่ต้องมี Session ของ Admin
// (ถ้าเรียกผ่าน HTTP ที่ /api/auth/admin/create-user ต้องล็อกอินเป็น admin ก่อน)
export async function createStaffAccount(auth: Auth, account: StaffAccount): Promise<void> {
  await auth.api.createUser({
    body: { email: account.email, name: account.name, role: account.role, password: account.password },
  })
}
