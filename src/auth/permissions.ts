// ใครทำอะไรได้บ้าง (Authorization) เขียนเป็นตารางเดียวด้วย Access Control ของ Better Auth
// ไฟล์นี้ยกมาจาก gear-up-api (src/auth/permissions.ts) ทั้งไฟล์ ไม่ได้แก้
// แยกจากโค้ดส่วนอื่น เวลาร้านเพิ่มสิทธิ์ใหม่ แก้ที่ไฟล์นี้ไฟล์เดียว
import { createAccessControl } from "better-auth/plugins/access"
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access"

// defaultStatements คือสิทธิ์ของ Admin Plugin เอง (สร้างบัญชี ตั้ง Role ฯลฯ)
// ต้องใส่ไว้ด้วย ไม่อย่างนั้นคุณภูมิจะสร้างบัญชีให้คุณขวัญไม่ได้
const statement = {
  ...defaultStatements,
  booking: ["read", "update"], // ดูกระดานงาน ย้ายรอบ ปิดงาน ยกเลิก
  service: ["update"], // แก้ราคาและเวลาของบริการ
} as const

export const ac = createAccessControl(statement)

// คุณขวัญ หน้าร้าน: ดูแลกระดานงานได้ แต่แก้ราคาไม่ได้
export const staff = ac.newRole({
  booking: ["read", "update"],
})

// คุณภูมิ เจ้าของ: ทำได้ทุกอย่างของ staff + แก้บริการ + จัดการบัญชีพนักงาน
export const admin = ac.newRole({
  ...adminAc.statements,
  booking: ["read", "update"],
  service: ["update"],
})

export const roles = { admin, staff }
export type RoleName = keyof typeof roles
