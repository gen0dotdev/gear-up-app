// สัญญา (Contract) ระหว่างหน้าเว็บ/Action กับชั้น services: ฟังก์ชันอะไรบ้างที่แอปเรียก
// services/ มาจาก gear-up-api ทั้งโฟลเดอร์ ไฟล์นี้บอกว่าแอปนี้ใช้ฟังก์ชันไหนบ้าง ด้วยพารามิเตอร์อะไร
// ถ้า gear-up-api เปลี่ยนชื่อหรือพารามิเตอร์ tsc จะฟ้องที่ src/server/services.ts ก่อนรันจริง
// Type ทั้งหมด re-export จากของจริง ไม่เขียนซ้ำ
import type { MoveTo } from "../services/move-booking.ts"
import type { NewBooking } from "../services/create-booking.ts"
import type { SlotView } from "../services/slots.ts"
import type { BookingView } from "../db/queries/bookings.ts"
import type { MechanicRow } from "../db/queries/mechanics.ts"
import type { ServiceChanges, ServiceRow } from "../db/queries/services.ts"

export type { Booking, CarSize, ServiceId, Status } from "../rules/booking-rules.ts"
export { BAYS, SLOT_TIMES } from "../rules/booking-rules.ts"
export type { ErrorKind } from "../services/errors.ts"
export type { BookingView, MechanicRow, MoveTo, NewBooking, ServiceChanges, ServiceRow, SlotView }
export type SlotsOfDay = { date: string; bays: number; slots: SlotView[] }

export type BookingServices<Db> = {
  getServices(db: Db): Promise<ServiceRow[]>
  changeService(db: Db, id: string, changes: ServiceChanges): Promise<ServiceRow>
  getSlots(db: Db, date: string): Promise<SlotsOfDay>
  createBooking(db: Db, input: NewBooking, now: Date): Promise<BookingView>
  lookupBooking(db: Db, code: string, phone: string): Promise<BookingView>
  cancelByGuest(db: Db, code: string, phone: string): Promise<BookingView>
  getBoard(db: Db, date: string): Promise<BookingView[]>
  moveBooking(db: Db, id: string, to: MoveTo, now: Date): Promise<BookingView>
  changeStatus(db: Db, id: string, to: "cancelled" | "done"): Promise<BookingView>
  getMechanics(db: Db): Promise<MechanicRow[]>
  assignMechanic(db: Db, bookingId: string, mechanicId: string | null): Promise<BookingView>
}
