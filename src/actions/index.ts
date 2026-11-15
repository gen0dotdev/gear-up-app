// Action ทั้งหมดของแอป: Astro อ่านไฟล์นี้ (ชื่อและตำแหน่งตายตัว src/actions/index.ts)
// ชื่อกลุ่มกลายเป็นชื่อ Action เช่น board.setStatus และ URL /_actions/board.setStatus
//
//   booking  ลูกค้า (ไม่ต้องล็อกอิน)
//   board    พนักงาน: requireStaff  ┐ ตารางสิทธิ์อยู่ที่ src/auth/access.ts
//   catalog  คุณภูมิ: requireAdmin   ┘ (middleware.ts ใช้ตารางเดียวกันกันอีกชั้น)
//
// เพิ่ม Action ของพนักงานใหม่: ใส่ในกลุ่ม board หรือ catalog และเรียก requireStaff / requireAdmin เสมอ
// ถ้าต้องตั้งกลุ่มใหม่ ต้องเพิ่มใน ACTION_RULES ของ access.ts ด้วย
import { board } from "./board.ts"
import { booking } from "./booking.ts"
import { catalog } from "./catalog.ts"

export const server = { booking, board, catalog }
