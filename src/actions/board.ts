// Action ของพนักงาน (คุณขวัญ, คุณภูมิ): กระดานงาน, ย้ายรอบ, ปิดงาน/ยกเลิก
// เทียบกับ routes/staff-bookings.ts ของ gear-up-api ที่ใส่ requireStaff ทีละ Route
// ที่นี่ทุก handler เรียก requireStaff(context) เป็นบรรทัดแรก ให้เห็นชัด ๆ ว่า Action ไหนมีด่าน
// React Island ของกระดาน (src/components/admin/) เรียก Action เหล่านี้แบบ RPC (ไม่ใช่ฟอร์ม)
import { defineAction } from "astro:actions"
import { z } from "astro/zod"
import { getDb } from "../server/db.ts"
import { now } from "../server/clock.ts"
import { assignMechanic, changeStatus, getBoard, getMechanics, getSlots, moveBooking } from "../server/services.ts"
import { run } from "./errors.ts"
import { requireStaff } from "./guard.ts"
import { DateText, SlotTime, Text } from "./schemas.ts"

export const board = {
  // ทุกอย่างที่กระดานของวันนั้นต้องใช้ในคำขอเดียว: รอบ (พร้อมช่องว่าง), การจอง และรายชื่อช่าง
  // ช่องว่างมาจาก getSlots ตัวเดียวกับหน้าร้าน กระดานจึงไม่ต้องนับเอง (ไม่มีกฎซ้ำสองที่)
  list: defineAction({
    input: z.object({ date: DateText }),
    handler: async ({ date }, context) => {
      requireStaff(context)
      const db = getDb()
      const [day, bookings, mechanics] = await run(() => Promise.all([getSlots(db, date), getBoard(db, date), getMechanics(db)]))
      return { slots: day.slots, bookings, mechanics }
    },
  }),

  // mechanicId ว่าง ("") จากเมนูเลือก = เอาช่างออก (null)
  assignMechanic: defineAction({
    input: z.object({ id: Text, mechanicId: z.string().trim().max(20) }),
    handler: ({ id, mechanicId }, context) => {
      requireStaff(context)
      return run(() => assignMechanic(getDb(), id, mechanicId || null))
    },
  }),

  move: defineAction({
    input: z.object({ id: Text, date: DateText, slot: SlotTime }),
    handler: ({ id, date, slot }, context) => {
      requireStaff(context)
      return run(() => moveBooking(getDb(), id, { date, slot }, now()))
    },
  }),

  // รับแค่ cancelled หรือ done: ไม่มีทางย้อนกลับเป็น booked
  setStatus: defineAction({
    input: z.object({ id: Text, status: z.enum(["cancelled", "done"]) }),
    handler: ({ id, status }, context) => {
      requireStaff(context)
      return run(() => changeStatus(getDb(), id, status))
    },
  }),
}
