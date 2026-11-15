# rules/ กฎล้วน ๆ (Pure Functions)

`booking-rules.ts` ยกมาจาก capstone ของคอร์ส typescript-basics: Type `Slot`, `Booking` และกฎ
`priceFor`, `baysLeft`, `canBook`

ไม่ import อะไรเลย ไม่มีฐานข้อมูล ไม่มี HTTP ไม่เรียก `new Date()` เอง
ให้ Input เดิมก็ได้คำตอบเดิมทุกครั้ง จึงทดสอบง่ายที่สุด (`tests/rules.test.ts`)
และย้ายไปใช้ใน Astro ได้ทั้งไฟล์

ที่เปลี่ยนจาก typescript-basics อธิบายไว้หัวไฟล์ (สั้น ๆ: ตัด `bookSlot`/`nextId` เพราะฐานข้อมูลออก id ให้แล้ว
เพิ่ม `priceFromTable`, `slotMessage`, `isPast`, `canChangeStatus`, `canDoService`)
