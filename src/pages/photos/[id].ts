// GET /photos/oil: รูปของบริการจาก R2 ไม่มีรูปก็ส่งรูปสำรองแทน
// หน้าร้านใส่ <img src="/photos/oil"> ได้เลย ไม่ต้องรู้ว่ารูปอยู่ที่ไหน
import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"
import { readPhoto } from "../../files/photos.ts"

export const GET: APIRoute = async ({ params, redirect }) => {
  const photo = params.id ? await readPhoto(env.BUCKET, params.id) : null
  if (!photo) return redirect("/images/service-fallback.svg", 302)

  return new Response(photo.body, {
    headers: {
      "Content-Type": photo.httpMetadata?.contentType ?? "application/octet-stream",
      // เก็บไว้สั้น ๆ: คุณภูมิอัปโหลดรูปใหม่แล้วลูกค้าเห็นภายในหนึ่งนาที
      "Cache-Control": "public, max-age=60",
      ETag: photo.httpEtag,
    },
  })
}
