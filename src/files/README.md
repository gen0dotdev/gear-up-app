# files/ ไฟล์ใน R2

`photos.ts`: รูปบริการ หนึ่งบริการหนึ่งรูป Key `services/<id>` (เช่น `services/oil`)

- **เขียน** ผ่าน Action `catalog.uploadPhoto` (คุณภูมิเท่านั้น) ไฟล์วิ่งผ่าน Worker แล้ว `env.BUCKET.put`
- **ตรวจ** ขนาด ≤ 2 MB, ชนิด JPG / PNG / WebP และไบต์แรกของไฟล์ต้องตรงกับชนิดที่บอก
- **อ่าน** ผ่าน `src/pages/photos/[id].ts` ไม่มีรูป → ส่งรูปสำรอง `/images/service-fallback.svg`

ตอน `npm run dev` R2 จำลองอยู่ใน `.wrangler/state` ไม่ต้องมีบัญชี Cloudflare
