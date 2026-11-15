// แปลง Error ของชั้น services เป็น Error ของ Action: ที่เดียวที่รู้ว่าชนิดไหนคือ Status อะไร
// เทียบได้กับ middleware/error-handler.ts ของ gear-up-api:
//   not-found → 404 (NOT_FOUND), conflict → 409 (CONFLICT), invalid → 400 (BAD_REQUEST)
// ข้อความของ services เป็นภาษาไทยที่แสดงให้ลูกค้าเห็นได้เลย เช่น "รอบนี้เต็มแล้ว"
import { ActionError, type ActionErrorCode } from "astro:actions"
import { ServiceError, type ErrorKind } from "../services/errors.ts"

const CODE: Record<ErrorKind, ActionErrorCode> = {
  invalid: "BAD_REQUEST",
  "not-found": "NOT_FOUND",
  conflict: "CONFLICT",
}

// ห่อการเรียก service ทุกครั้งใน Action: Error ของร้านกลายเป็น ActionError ที่ฟอร์มแสดงได้
// Error อื่น (บั๊กของเรา) ปล่อยต่อ Astro ตอบ 500 และไม่ส่งรายละเอียดให้คนนอก
export async function run<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (error) {
    if (error instanceof ServiceError) throw new ActionError({ code: CODE[error.kind], message: error.message })
    throw error
  }
}
