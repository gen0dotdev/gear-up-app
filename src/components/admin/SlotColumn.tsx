// คอลัมน์ของหนึ่งรอบ: เวลา และข้อความช่องว่างจาก getSlots (เซิร์ฟเวอร์นับให้แล้ว)
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { BoardSlot } from "./board-api.ts"

type Props = { slot: BoardSlot; children: ReactNode }

export default function SlotColumn({ slot, children }: Props) {
  return (
    <section className="space-y-2 rounded-xl bg-muted p-3" data-slot-time={slot.time}>
      <h2 className="text-lg font-semibold">{slot.time}</h2>
      <p className={cn("text-sm", slot.left === 0 ? "text-destructive" : "text-muted-foreground")}>{slot.message}</p>
      {children}
    </section>
  )
}
