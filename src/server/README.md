# server/ จุดต่อสาย (Wiring) ฝั่งเซิร์ฟเวอร์

ไฟล์เล็ก ๆ ที่หยิบ "ของ" จาก Cloudflare (`env`) มาประกอบให้ Action และหน้าเว็บใช้ ไม่มีกฎของร้านอยู่ที่นี่

| ไฟล์ | งาน |
| --- | --- |
| `services.ts` | ฟังก์ชันของชั้น services ที่ทั้งแอปเรียก (import จาก `src/services/*`) |
| `contract.ts` | รายชื่อและพารามิเตอร์ของ services ที่แอปใช้ ถ้า gear-up-api เปลี่ยน tsc ฟ้องที่ `services.ts` |
| `db.ts` | `getDb()`: `createDb(env.DB)` ใหม่ทุกคำขอ |
| `clock.ts` | `now()`: ตอนนี้กี่โมง (อ่าน `NOW` ได้) |
| `auth.ts` | `getAuth()`: Better Auth ของคำขอนี้ (ต่อ D1) |

ทุกไฟล์ที่ `import { env } from "cloudflare:workers"` อยู่ที่นี่ (และ `src/pages/photos/`) เท่านั้น
โค้ดชั้นอื่นจึงไม่ผูกกับ Cloudflare และย้ายไปที่อื่นได้
