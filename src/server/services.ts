// ฟังก์ชันของชั้น services ที่ Action และหน้าเว็บเรียก: ทั้งหมดมาจาก src/services/ (ไฟล์เดียวกับ gear-up-api)
// Type BookingServices<Db> ทำให้ tsc ฟ้องทันที ถ้าวันหนึ่ง gear-up-api เปลี่ยนชื่อหรือพารามิเตอร์ของ service
import type { BookingServices } from "./contract.ts"
import type { Db } from "./db.ts"
import { assignMechanic } from "../services/assign-mechanic.ts"
import { getBoard } from "../services/board.ts"
import { changeService, getServices } from "../services/catalog.ts"
import { changeStatus } from "../services/change-status.ts"
import { createBooking } from "../services/create-booking.ts"
import { cancelByGuest, lookupBooking } from "../services/guest-booking.ts"
import { getMechanics } from "../services/mechanics.ts"
import { moveBooking } from "../services/move-booking.ts"
import { getSlots } from "../services/slots.ts"

// รวมเป็นก้อนเดียวไว้เช็กกับสัญญา: satisfies ให้ tsc ฟ้องที่นี่ถ้า service ไหนหายหรือพารามิเตอร์เปลี่ยน
export const services = {
  getServices,
  changeService,
  getSlots,
  createBooking,
  lookupBooking,
  cancelByGuest,
  getBoard,
  moveBooking,
  changeStatus,
  getMechanics,
  assignMechanic,
} satisfies BookingServices<Db>

export {
  assignMechanic,
  cancelByGuest,
  changeService,
  changeStatus,
  createBooking,
  getBoard,
  getMechanics,
  getServices,
  getSlots,
  lookupBooking,
  moveBooking,
}
