// ช่างของร้าน: รายชื่อและบริการที่แต่ละคนทำ (หน้ากระดานใช้แสดงตัวเลือกตอนมอบหมายช่าง)
import type { Db } from "../db/index.ts"
import { listMechanics } from "../db/queries/mechanics.ts"

export function getMechanics(db: Db) {
  return listMechanics(db)
}
