# auth/ ล็อกอินและสิทธิ์ (Better Auth)

| ไฟล์ | งาน | มาจาก gear-up-api |
| --- | --- | --- |
| `auth.ts` | `createAuth(env.DB, options)` อีเมล + รหัสผ่าน, `disableSignUp`, Admin Plugin | ย้ายมา เปลี่ยนแค่ `database` |
| `permissions.ts` | ตารางสิทธิ์ `admin` / `staff` ด้วย `createAccessControl` | ทั้งไฟล์ ไม่แก้ |
| `staff.ts` | บัญชีพนักงานสองคนและรหัสผ่านสำหรับ Dev | ทั้งไฟล์ ไม่แก้ |
| `access.ts` | `can()` และตารางว่าหน้าไหน / Action ไหนต้องมีสิทธิ์อะไร | ใหม่ (แทน `require-role.ts`) |
| `client.ts` | Better Auth ฝั่ง Browser สำหรับหน้า `/login` และปุ่มออกจากระบบ | ใหม่ |

รายละเอียดด่านตรวจสองชั้น: `docs/auth.md`
