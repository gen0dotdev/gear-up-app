// ฝั่ง Browser เรียก Action ของกระดานผ่านไฟล์นี้ (แทน api.ts เซิร์ฟเวอร์จำลองของคอร์ส react-basics)
// actions.board.* จาก astro:actions คือ fetch ไปที่ /_actions/board.* ที่ Astro เขียนให้ พร้อม Type
// .orThrow: ถ้า Action ตอบ Error ให้ throw ออกมา TanStack Query จะจับไปใส่ error ให้เอง
import { actions } from "astro:actions"

export const loadBoard = (date: string) => actions.board.list.orThrow({ date })
export type BoardData = Awaited<ReturnType<typeof loadBoard>>
export type BoardBooking = BoardData["bookings"][number]
export type BoardSlot = BoardData["slots"][number]
export type Mechanic = BoardData["mechanics"][number]

export const markDone = (id: string) => actions.board.setStatus.orThrow({ id, status: "done" })
export const cancelBooking = (id: string) => actions.board.setStatus.orThrow({ id, status: "cancelled" })
export const moveBooking = (input: { id: string; date: string; slot: "09:00" | "11:00" | "13:00" | "15:00" }) =>
  actions.board.move.orThrow(input)
export const assignMechanic = (input: { id: string; mechanicId: string }) => actions.board.assignMechanic.orThrow(input)
