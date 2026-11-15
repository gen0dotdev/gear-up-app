// Error ของชั้น Business Logic: บอก "ชนิด" ของปัญหา ไม่บอก Status Code
// services/ ไม่รู้จัก HTTP (ฟังก์ชันพวกนี้ถูกเรียกจาก Test, Script หรือ Astro ก็ได้)
// middleware/error-handler.ts เป็นคนแปลงชนิดเป็น 404 / 409 / 400
export type ErrorKind = "not-found" | "conflict" | "invalid"

export class ServiceError extends Error {
  readonly kind: ErrorKind

  constructor(kind: ErrorKind, message: string) {
    super(message)
    this.name = "ServiceError"
    this.kind = kind
  }
}

// ไม่มีของที่ขอ (บริการ, รอบ, การจอง)
export const notFound = (message: string) => new ServiceError("not-found", message)
// มีของแต่ทำไม่ได้เพราะสถานะตอนนี้ (รอบเต็ม, รถซ้ำ, ปิดงานไปแล้ว)
export const conflict = (message: string) => new ServiceError("conflict", message)
// ข้อมูลถูกรูปแบบแต่ใช้ไม่ได้ (รอบที่ผ่านไปแล้ว)
export const invalid = (message: string) => new ServiceError("invalid", message)
