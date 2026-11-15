// บริการและราคาของร้าน
import type { Db } from "../db/index.ts"
import * as servicesTable from "../db/queries/services.ts"
import { notFound } from "./errors.ts"

export function getServices(db: Db) {
  return servicesTable.listServices(db)
}

// คุณภูมิแก้ราคาและเวลา: มีผลกับการจองใหม่เท่านั้น
// การจองเดิมเก็บราคาตอนจองไว้ใน bookings.price แล้ว (ดู services/README.md)
export async function changeService(db: Db, id: string, changes: servicesTable.ServiceChanges) {
  const row = await servicesTable.updateService(db, id, changes)
  if (!row) throw notFound("ไม่พบบริการนี้")
  return row
}
