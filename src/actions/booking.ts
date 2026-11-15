// Action ของลูกค้า (Guest ไม่ต้องล็อกอิน): จอง, ดูการจองของฉัน, ยกเลิก
// เทียบกับ routes/guest-bookings.ts ของ gear-up-api: Route กลายเป็น Action
// ส่วน Zod และการเรียก service เหมือนเดิม ต่างกันแค่ไม่ต้อง parse req.body เอง
import { defineAction } from "astro:actions"
import { z } from "astro/zod"
import { getDb } from "../server/db.ts"
import { now } from "../server/clock.ts"
import { cancelByGuest, createBooking, lookupBooking } from "../server/services.ts"
import { run } from "./errors.ts"
import { BookingCode, CarSize, DateText, Phone, SlotTime, Text } from "./schemas.ts"

export const booking = {
  // accept: "form" = รับ FormData จาก <form method="POST"> ตรง ๆ หน้าจองจึงทำงานได้แม้ไม่มี JavaScript
  create: defineAction({
    accept: "form",
    input: z.object({
      date: DateText,
      slot: SlotTime,
      // ไม่ใช้ z.enum ของ 4 บริการ: บริการที่ไม่มีควรได้ "ไม่พบบริการนี้" จาก service (เหมือน API)
      service: Text,
      customer: Text,
      phone: Phone,
      car: Text,
      plate: Text,
      carSize: CarSize,
    }),
    handler: (input) => run(() => createBooking(getDb(), input, now())),
  }),

  lookup: defineAction({
    accept: "form",
    input: z.object({ code: BookingCode, phone: Phone }),
    handler: ({ code, phone }) => run(() => lookupBooking(getDb(), code, phone)),
  }),

  // ยกเลิกต้องมีทั้งรหัสจองและเบอร์โทร เหมือนตอนค้น: รู้แค่รหัสอย่างเดียวยกเลิกของคนอื่นไม่ได้
  cancel: defineAction({
    accept: "form",
    input: z.object({ code: BookingCode, phone: Phone }),
    handler: ({ code, phone }) => run(() => cancelByGuest(getDb(), code, phone)),
  }),
}
