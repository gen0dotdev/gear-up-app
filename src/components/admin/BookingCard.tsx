// การ์ดของหนึ่งการจอง (BookingCard ของคอร์ส react-basics + ราคา, ย้ายรอบ, เลือกช่าง)
// ปุ่มและเมนูแสดงเฉพาะการจองที่ยัง booked แต่การซ่อนปุ่มไม่ใช่ด่าน: Action เช็กกฎซ้ำเสมอ
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { baht, SERVICE_NAMES, STATUS_LABELS } from "@/lib/labels"
import type { BoardBooking, Mechanic } from "./board-api.ts"

type SlotTime = "09:00" | "11:00" | "13:00" | "15:00"

type Props = {
  booking: BoardBooking
  mechanics: Mechanic[]
  otherTimes: string[]
  busy: boolean
  onDone: () => void
  onCancel: () => void
  onMove: (slot: SlotTime) => void
  onAssign: (mechanicId: string) => void
}

const select = "h-7 rounded-md border border-input bg-background px-2 text-[0.8rem]"

export default function BookingCard({ booking, mechanics, otherTimes, busy, onDone, onCancel, onMove, onAssign }: Props) {
  const cancelled = booking.status === "cancelled"
  const open = booking.status === "booked"
  // เมนูเลือกช่าง: แสดงเฉพาะช่างที่ทำบริการนี้ได้ (Action ก็เช็กซ้ำ)
  const able = mechanics.filter((m) => m.services.includes(booking.service))
  const current = booking.mechanicId ?? ""

  return (
    <Card size="sm" className={cn(cancelled && "opacity-50")} data-booking={booking.id}>
      <CardHeader>
        <CardTitle className={cn(cancelled && "line-through")}>
          {booking.id} {booking.customer}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p>
          {booking.car} {booking.plate}
        </p>
        <p>
          {SERVICE_NAMES[booking.service]} · {baht(booking.price)}
        </p>
        {!open && <p>{booking.mechanic || "ยังไม่มีช่าง"}</p>}
        <Badge variant={booking.status === "done" ? "default" : cancelled ? "outline" : "secondary"}>{STATUS_LABELS[booking.status]}</Badge>
        {booking.note && <p className="text-xs text-muted-foreground">{booking.note}</p>}

        {open && (
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-xs">
              ช่าง
              <select className={select} value={current} disabled={busy} onChange={(e) => onAssign(e.target.value)} aria-label={`ช่างของ ${booking.id}`}>
                <option value="">ยังไม่มีช่าง</option>
                {able.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs">
              ย้ายไป
              <select
                className={select}
                value=""
                disabled={busy}
                onChange={(e) => e.target.value && onMove(e.target.value as SlotTime)}
                aria-label={`ย้ายรอบของ ${booking.id}`}
              >
                <option value="">เลือกรอบ</option>
                {otherTimes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <Button size="sm" disabled={busy} onClick={onDone}>
                ปิดงาน
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={onCancel}>
                ยกเลิก
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
