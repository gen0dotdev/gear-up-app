// รหัสจองที่ลูกค้าได้ เช่น GU-7K2P ใช้คู่กับเบอร์โทรเพื่อดูหรือยกเลิกการจอง
import { randomInt } from "node:crypto"

// ไม่มี 0/O และ 1/I/L ที่อ่านสลับกันง่ายเวลาลูกค้าอ่านให้ฟังทางโทรศัพท์
const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"

// randomInt ของ node:crypto เดายากกว่า Math.random
// รหัสนี้เป็นครึ่งหนึ่งของ "กุญแจ" (อีกครึ่งคือเบอร์โทร) จึงไม่ควรเดาได้
export function newBookingCode(): string {
  let code = "GU-"
  for (let i = 0; i < 4; i++) code += CHARS[randomInt(CHARS.length)]
  return code
}
