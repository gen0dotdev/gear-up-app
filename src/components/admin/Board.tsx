// กระดานงานของคุณขวัญ: App.tsx ของคอร์ส react-basics ที่ตอนนี้คุยกับ Action จริง
// ที่เพิ่มจาก react-basics: ย้ายรอบ และมอบหมายช่าง (ทั้งสองอย่างเป็น Action ที่เช็กกฎที่เซิร์ฟเวอร์)
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import BookingCard from "./BookingCard.tsx"
import SlotColumn from "./SlotColumn.tsx"
import { assignMechanic, cancelBooking, loadBoard, markDone, moveBooking } from "./board-api.ts"

const ALL = "ทุกคน"
const UNASSIGNED = "ยังไม่มีช่าง"

type Props = { today: string; tomorrow: string }

export default function Board({ today, tomorrow }: Props) {
  const days = [
    { date: today, label: "วันนี้" },
    { date: tomorrow, label: "พรุ่งนี้" },
  ]
  const [date, setDate] = useState(tomorrow)
  const [mechanic, setMechanic] = useState(ALL)
  const queryClient = useQueryClient()

  // วันอยู่ใน queryKey: แต่ละวันมีช่องในที่เก็บ (Cache) ของตัวเอง
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["board", date],
    queryFn: () => loadBoard(date),
  })

  // ["board"] ล้างทุกวัน: ย้ายรอบข้ามวันก็เห็นถูกทั้งสองวัน
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["board"] })
  const done = useMutation({ mutationFn: markDone, onSuccess: refresh })
  const cancel = useMutation({ mutationFn: cancelBooking, onSuccess: refresh })
  const move = useMutation({ mutationFn: moveBooking, onSuccess: refresh })
  const assign = useMutation({ mutationFn: assignMechanic, onSuccess: refresh })

  const busy = done.isPending || cancel.isPending || move.isPending || assign.isPending
  const failed = done.error ?? cancel.error ?? move.error ?? assign.error

  const names = [ALL, ...(data?.mechanics.map((m) => m.name) ?? []), UNASSIGNED]
  const visible = (data?.bookings ?? []).filter((b) =>
    mechanic === ALL ? true : mechanic === UNASSIGNED ? b.mechanic === "" : b.mechanic === mechanic,
  )

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">กระดานงาน Gear Up</h1>
        <p className="text-muted-foreground">ปิดงาน ยกเลิก ย้ายรอบ และมอบหมายช่าง</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {days.map((d) => (
          <Button key={d.date} variant={d.date === date ? "default" : "outline"} onClick={() => setDate(d.date)}>
            {d.label} {d.date.slice(8)}/{d.date.slice(5, 7)}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {names.map((name) => (
          <Button key={name} size="sm" variant={name === mechanic ? "secondary" : "ghost"} onClick={() => setMechanic(name)}>
            {name}
          </Button>
        ))}
      </div>

      {failed && <p role="alert" className="text-destructive">ทำไม่สำเร็จ: {failed.message}</p>}
      {isPending && <p className="text-muted-foreground">กำลังโหลดกระดาน...</p>}
      {isError && <p className="text-destructive">โหลดกระดานไม่สำเร็จ: {error.message}</p>}

      {data && data.slots.length === 0 && <p className="text-muted-foreground">วันนี้ร้านไม่มีรอบ</p>}
      {data && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.slots.map((slot) => (
            <SlotColumn key={slot.time} slot={slot}>
              {visible
                .filter((b) => b.slot === slot.time)
                .map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    mechanics={data.mechanics}
                    otherTimes={data.slots.map((s) => s.time).filter((t) => t !== b.slot)}
                    busy={busy}
                    onDone={() => done.mutate(b.id)}
                    onCancel={() => cancel.mutate(b.id)}
                    onMove={(slot) => move.mutate({ id: b.id, date, slot })}
                    onAssign={(mechanicId) => assign.mutate({ id: b.id, mechanicId })}
                  />
                ))}
            </SlotColumn>
          ))}
        </div>
      )}
    </main>
  )
}
