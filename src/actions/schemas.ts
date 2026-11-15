// ชิ้นส่วน Zod ที่หลาย Action ใช้ร่วมกัน (ยกมาจาก routes/schemas.ts ของ gear-up-api)
// Type ของ TypeScript หายไปตอนรัน ข้อมูลจากฟอร์มจึงต้องตรวจด้วย Zod
// Action ของ Astro ใช้ Zod ตัวที่มากับ Astro (astro/zod) ไม่ต้องติดตั้งเพิ่ม
import { z } from "astro/zod"
import { SLOT_TIMES } from "../server/contract.ts"

export const DateText = z.iso.date({ error: "วันที่ต้องเป็นแบบ YYYY-MM-DD เช่น 2026-11-17" })

export const SlotTime = z.enum(SLOT_TIMES, { error: "เลือกรอบ 09:00, 11:00, 13:00 หรือ 15:00" })

// รับได้ทั้ง 0812341001 และ 081-234-1001 แล้วเก็บเป็นแบบเดียว (081-234-1001)
// ถ้าเก็บตามที่พิมพ์มา ค้นด้วยเบอร์เดียวกันแต่ใส่ขีดต่างกันจะไม่เจอ
export const Phone = z
  .string()
  .trim()
  .regex(/^0\d{2}-?\d{3}-?\d{4}$/, { error: "เบอร์โทรต้องเป็นเบอร์มือถือ 10 หลัก เช่น 081-234-1001" })
  .transform((p) => {
    const d = p.replaceAll("-", "")
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  })

export const BookingCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^GU-[A-Z0-9]{4}$/, { error: "รหัสจองต้องเป็นแบบ GU-XXXX" })

export const Text = z.string().trim().min(1, { error: "ห้ามว่าง" }).max(100)

export const CarSize = z.enum(["small", "big"], { error: "เลือกขนาดรถ" })

// ราคาและนาทีจากฟอร์มเป็นข้อความ coerce แปลงเป็นตัวเลขก่อนตรวจ
export const PositiveInt = z.coerce.number({ error: "ต้องเป็นตัวเลข" }).int().positive({ error: "ต้องมากกว่า 0" })
