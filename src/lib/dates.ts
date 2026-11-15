// วันที่ของร้าน (เวลาไทย +07:00) เป็นข้อความแบบ "2026-11-17" ซึ่งเป็นแบบที่ services ใช้
// ไม่ใช้ toISOString() ตรง ๆ เพราะนั่นคือเวลา UTC: ตอน 06:00 ที่ไทย UTC ยังเป็นเมื่อวาน

const DAY_MS = 24 * 60 * 60 * 1000
const BANGKOK_MS = 7 * 60 * 60 * 1000

export function dayOf(at: Date): string {
  return new Date(at.getTime() + BANGKOK_MS).toISOString().slice(0, 10)
}

export function tomorrowOf(at: Date): string {
  return dayOf(new Date(at.getTime() + DAY_MS))
}

// "อังคาร 17 พ.ย." สำหรับแสดงบนหน้าเว็บ
export function thaiDay(date: string): string {
  return new Date(`${date}T12:00:00+07:00`).toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Bangkok",
  })
}
