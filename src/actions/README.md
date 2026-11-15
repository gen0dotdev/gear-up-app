# actions/ Route ของแอปในรูป Astro Action

Action หนึ่งตัว = Route หนึ่งเส้นของ Express: Zod ตรวจ Input → เรียก service → คืนผลหรือ Error

| ไฟล์ | กลุ่ม | ใครเรียกได้ | เทียบกับ gear-up-api |
| --- | --- | --- | --- |
| `booking.ts` | `booking.create`, `.lookup`, `.cancel` | ทุกคน (Guest) | `routes/guest-bookings.ts` |
| `board.ts` | `board.list`, `.move`, `.setStatus`, `.assignMechanic` | staff, admin (`requireStaff`) | `routes/staff-bookings.ts` |
| `catalog.ts` | `catalog.updateService`, `.uploadPhoto` | admin (`requireAdmin`) | `routes/services.ts` |
| `schemas.ts` | ชิ้นส่วน Zod (เบอร์โทร, รอบ, รหัสจอง) | | `routes/schemas.ts` |
| `errors.ts` | `ServiceError` → `ActionError` (404 / 409 / 400) | | `middleware/error-handler.ts` |
| `guard.ts` | `requireStaff`, `requireAdmin` (401 / 403) | | `middleware/require-role.ts` |
| `index.ts` | รวมทุกกลุ่มเป็น `server` (Astro อ่านไฟล์นี้) | | `app.ts` |

ลูกค้าเรียกผ่าน `<form method="POST" action={actions.booking.create}>` (ไม่ต้องมี JavaScript)
กระดานงานเรียกแบบ RPC จาก React: `actions.board.setStatus.orThrow({ id, status })`
