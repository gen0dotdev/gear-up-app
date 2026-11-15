// Action ของคุณภูมิ (admin): แก้ราคาและเวลาของบริการ, อัปโหลดรูปบริการขึ้น R2
// ทุก handler เรียก requireAdmin(context) เป็นบรรทัดแรก (คุณขวัญล็อกอินแล้วก็เรียกไม่ได้: 403)
import { ActionError, defineAction } from "astro:actions"
import { z } from "astro/zod"
import { env } from "cloudflare:workers"
import { checkPhoto, savePhoto } from "../files/photos.ts"
import { getDb } from "../server/db.ts"
import { changeService, getServices } from "../server/services.ts"
import { run } from "./errors.ts"
import { requireAdmin } from "./guard.ts"
import { PositiveInt, Text } from "./schemas.ts"

export const catalog = {
  updateService: defineAction({
    accept: "form",
    input: z.object({ id: Text, minutes: PositiveInt, price: PositiveInt, priceBig: PositiveInt }),
    handler: ({ id, ...changes }, context) => {
      requireAdmin(context)
      return run(() => changeService(getDb(), id, changes))
    },
  }),

  // ไฟล์มาทางฟอร์ม (multipart/form-data) ผ่าน Worker ของเรา แล้ว Worker เขียนลง R2 เอง
  // ไม่ใช้ Presigned URL: รูปเล็ก และการเช็กสิทธิ์อยู่ที่เดียว (ที่นี่)
  uploadPhoto: defineAction({
    accept: "form",
    input: z.object({ id: Text, photo: z.instanceof(File, { error: "เลือกไฟล์รูปก่อน" }) }),
    handler: async ({ id, photo }, context) => {
      requireAdmin(context)
      const services = await getServices(getDb())
      if (!services.some((s) => s.id === id)) throw new ActionError({ code: "NOT_FOUND", message: "ไม่พบบริการนี้" })

      const problem = await checkPhoto(photo)
      if (problem) throw new ActionError({ code: "BAD_REQUEST", message: problem })

      await savePhoto(env.BUCKET, id, photo)
      return { id, size: photo.size }
    },
  }),
}
