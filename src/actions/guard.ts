// ด่านตรวจของ Action พนักงาน: ทุก Action ในกลุ่ม board และ catalog เรียกบรรทัดแรก
//   UNAUTHORIZED (401) = ยังไม่ได้ล็อกอิน (ไม่รู้ว่าเป็นใคร: Authentication)
//   FORBIDDEN (403)    = ล็อกอินแล้ว แต่ Role นี้ไม่มีสิทธิ์ (Authorization)
//
// ทำไมต้องเช็กใน Action ทั้งที่หน้า /admin ก็ล็อกไว้แล้ว:
// Action คือ Endpoint (POST /_actions/board.setStatus) ใครก็เรียกตรงได้ด้วย fetch หรือ curl
// โดยไม่ต้องเปิดหน้า /admin เลย ล็อกแค่หน้าเว็บ = ล็อกประตูหน้าร้านแต่เปิดประตูหลังไว้
// (บทเรียน ai-action-check) middleware.ts ก็เช็กชื่อ Action ซ้ำอีกชั้นจากตารางเดียวกัน
import { ActionError, type ActionAPIContext } from "astro:actions"
import { ADMIN, can, STAFF } from "../auth/access.ts"

type Permission = typeof STAFF

function requirePermission(context: ActionAPIContext, permission: Permission) {
  const user = context.locals.user
  if (!user) throw new ActionError({ code: "UNAUTHORIZED", message: "กรุณาล็อกอินก่อน" })
  if (!can(user.role, permission)) throw new ActionError({ code: "FORBIDDEN", message: "บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้" })
  return user
}

// คุณขวัญและคุณภูมิ: กระดานงาน ย้ายรอบ ปิดงาน ยกเลิก
export const requireStaff = (context: ActionAPIContext) => requirePermission(context, STAFF)
// คุณภูมิคนเดียว: แก้ราคาและรูปบริการ
export const requireAdmin = (context: ActionAPIContext) => requirePermission(context, ADMIN)
