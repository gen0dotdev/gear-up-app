// ใครเข้าอะไรได้ (Authorization) ตารางเดียวสำหรับทั้ง "หน้าเว็บ" และ "Action"
// middleware.ts อ่านตารางนี้ และ Action ทุกตัวของพนักงานเรียก requireStaff / requireAdmin
// (src/actions/guard.ts) ซึ่งก็ใช้ can() ตัวเดียวกันนี้ กฎจึงไม่มีสองที่ที่ตอบไม่ตรงกัน
import { roles, type RoleName } from "./permissions.ts"

type Permission = Parameters<(typeof roles)["admin"]["authorize"]>[0]

// สิทธิ์สองแบบที่แอปใช้ (ชื่อตรงกับ requireStaff / requireAdmin ของ gear-up-api)
export const STAFF: Permission = { booking: ["read", "update"] } // คุณขวัญและคุณภูมิ: กระดานงาน
export const ADMIN: Permission = { service: ["update"] } // คุณภูมิคนเดียว: ราคาและรูปบริการ

function isRoleName(role: string | null | undefined): role is RoleName {
  return role === "admin" || role === "staff"
}

export function can(role: string | null | undefined, permission: Permission): boolean {
  return isRoleName(role) && roles[role].authorize(permission).success
}

// หน้าเว็บ: ขึ้นต้นด้วย path นี้ต้องมีสิทธิ์นี้ (เรียงจากเจาะจงที่สุดก่อน)
export const PAGE_RULES: { prefix: string; need: Permission }[] = [
  { prefix: "/admin/services", need: ADMIN },
  { prefix: "/admin", need: STAFF },
]

// Action: ชื่อขึ้นต้นด้วยกลุ่มนี้ต้องมีสิทธิ์นี้ (ชื่อกลุ่มมาจาก src/actions/index.ts)
// Action ที่ไม่อยู่ในตาราง (กลุ่ม booking) เป็นของลูกค้า เรียกได้โดยไม่ล็อกอิน
export const ACTION_RULES: { prefix: string; need: Permission }[] = [
  { prefix: "catalog.", need: ADMIN },
  { prefix: "board.", need: STAFF },
]

export function ruleFor(rules: { prefix: string; need: Permission }[], name: string): Permission | undefined {
  return rules.find((rule) => name.startsWith(rule.prefix))?.need
}
