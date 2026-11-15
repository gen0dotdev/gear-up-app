// คำที่หน้าเว็บแสดง (ชั้น Presentation) แยกจากกฎของร้าน
import type { ServiceId, Status } from "../server/contract.ts"

// ชื่อบริการสำหรับกระดานงาน (การจองเก็บแค่ id ของบริการ)
export const SERVICE_NAMES: Record<ServiceId, string> = {
  oil: "เปลี่ยนน้ำมันเครื่อง",
  tyres: "สลับยางและถ่วงล้อ",
  brakes: "เปลี่ยนผ้าเบรก",
  check: "เช็กระยะ",
}

// ป้ายสถานะบนกระดาน (data sheet: รอทำ / เสร็จแล้ว / ยกเลิกแล้ว)
export const STATUS_LABELS: Record<Status, string> = {
  booked: "รอทำ",
  done: "เสร็จแล้ว",
  cancelled: "ยกเลิกแล้ว",
}

export const MECHANICS = ["ช่างตั้ม", "ช่างโอม", "ช่างเบียร์"]

export function baht(amount: number): string {
  return `${amount.toLocaleString("th-TH")} บาท`
}
