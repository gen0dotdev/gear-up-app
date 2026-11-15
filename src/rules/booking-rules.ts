// กฎการจองของศูนย์บริการรถยนต์ Gear Up
// ไฟล์นี้ยกมาจาก capstone ของคอร์ส typescript-basics แทบทั้งไฟล์
// ไม่ import framework หรือฐานข้อมูลใดเลย จึงใช้ได้ทั้งใน Express, Astro
// และใน Test โดยไม่ต้องต่อฐานข้อมูล
//
// ที่เปลี่ยนจาก typescript-basics:
// - ตัด bookSlot และ nextId ออก เพราะตอนนี้ฐานข้อมูลเป็นคนสร้าง id ให้
//   (ถ้าโค้ดนับ id เอง สองคำขอที่มาพร้อมกันอาจได้ id เดียวกัน)
// - เพิ่ม priceFromTable เพราะคุณภูมิแก้ราคาได้ทาง API ราคาจริงจึงอยู่ในตาราง services
// - เพิ่ม slotMessage ข้อความใต้แต่ละรอบที่หน้าเว็บแสดง

export type Status = "booked" | "cancelled" | "done"
export type CarSize = "small" | "big"
export type ServiceId = "oil" | "tyres" | "brakes" | "check"

export const SLOT_TIMES = ["09:00", "11:00", "13:00", "15:00"] as const
export const BAYS = 4

// หนึ่งรอบของหนึ่งวัน เช่น { date: "2026-11-17", time: "09:00", bays: 4 }
export type Slot = {
  date: string
  time: string
  bays: number
}

// Shape เดียวกับ types.ts ของ admin board (react-basics)
// API ตอบการจองในรูปนี้ admin board จึงเรียก API นี้ได้เลย
export type Booking = {
  id: string
  date: string
  slot: string
  customer: string
  phone: string
  car: string
  plate: string
  carSize: CarSize
  service: ServiceId
  mechanic: string
  status: Status
  note?: string
}

export type Check = { ok: true } | { ok: false; reason: string }

export const FULL = "รอบนี้เต็มแล้ว"
export const SAME_CAR = "รถคันนี้จองรอบนี้ไว้แล้ว"
export const ONLY_BOOKED = "เปลี่ยนได้เฉพาะการจองที่ยังเป็น booked"

// ราคาตั้งต้นจากคอร์ส typescript-basics (ใช้เป็นราคาใน seed และใน Test)
export function priceFor(service: ServiceId, carSize: CarSize): number {
  if (service === "oil") return carSize === "big" ? 1600 : 1200
  if (service === "tyres") return 800
  if (service === "brakes") return 2500
  return 3500
}

// ราคาจริงตอนรันอ่านจากตาราง services เพราะคุณภูมิเปลี่ยนราคาได้
// กฎยังเหมือนเดิม: รถใหญ่ใช้ priceBig รถเล็กใช้ price
export function priceFromTable(row: { price: number; priceBig: number }, carSize: CarSize): number {
  return carSize === "big" ? row.priceBig : row.price
}

// booked และ done ใช้ช่อง ส่วน cancelled คืนช่องให้ร้าน
export function isActive(booking: Pick<Booking, "status">): boolean {
  return booking.status !== "cancelled"
}

function activeIn(slot: Slot, list: Booking[]): Booking[] {
  return list.filter((b) => b.date === slot.date && b.slot === slot.time && isActive(b))
}

export function baysLeft(slot: Slot, list: Booking[]): number {
  return slot.bays - activeIn(slot, list).length
}

export function slotMessage(left: number): string {
  if (left <= 0) return "เต็มแล้ว"
  if (left === 1) return "เหลือช่องสุดท้าย"
  return `เหลือ ${left} ช่อง`
}

// รอบเริ่มกี่โมงตามเวลาไทย (+07:00) เทียบกับ "ตอนนี้" ที่ส่งเข้ามา
// รับ now เป็นพารามิเตอร์แทนการเรียก new Date() เอง ฟังก์ชันนี้จึงยัง Pure และทดสอบได้ทุกวัน
export function isPast(slot: Slot, now: Date): boolean {
  const startsAt = new Date(`${slot.date}T${slot.time}:00+07:00`)
  return startsAt.getTime() <= now.getTime()
}

// เช็กรถซ้ำก่อนรอบเต็ม: ถ้ารถคันนี้อยู่ในรอบแล้ว ข้อความ "จองไว้แล้ว" ช่วยลูกค้ามากกว่า "เต็ม"
export function canBook(slot: Slot, plate: string, list: Booking[]): Check {
  const active = activeIn(slot, list)
  if (active.some((b) => b.plate === plate)) {
    return { ok: false, reason: SAME_CAR }
  }
  if (active.length >= slot.bays) {
    return { ok: false, reason: FULL }
  }
  return { ok: true }
}

// ช่างรับงานได้เฉพาะบริการที่ตัวเองทำ (ช่างตั้ม: น้ำมันเครื่องและเช็กระยะ)
export function canDoService(mechanic: { name: string; services: readonly string[] }, service: ServiceId): Check {
  if (mechanic.services.includes(service)) return { ok: true }
  return { ok: false, reason: `${mechanic.name}ไม่ได้รับงานบริการนี้` }
}

// เปลี่ยนได้เฉพาะการจองที่ยังเป็น booked
export function canChangeStatus(booking: Pick<Booking, "status">): Check {
  if (booking.status !== "booked") return { ok: false, reason: ONLY_BOOKED }
  return { ok: true }
}
