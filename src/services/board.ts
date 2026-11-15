// กระดานงานของคุณขวัญ: การจองทุกคันของวันนั้น (รวมที่ยกเลิก เพื่อให้เห็นประวัติ)
import type { Db } from "../db/index.ts"
import { bookingsOn, type BookingView } from "../db/queries/bookings.ts"

export function getBoard(db: Db, date: string): Promise<BookingView[]> {
  return bookingsOn(db, date)
}
