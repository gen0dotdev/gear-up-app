// ทุก URL ใต้ /api/auth/ (ล็อกอิน, ออกจากระบบ, อ่าน Session, Admin Plugin) ส่งให้ Better Auth ตอบ
// เทียบกับ app.all("/api/auth/*splat", toNodeHandler(auth)) ใน gear-up-api
// Better Auth รับ Request มาตรฐานของเว็บและคืน Response อยู่แล้ว จึงต่อกับ Astro ได้ตรง ๆ
import type { APIRoute } from "astro"
import { getAuth } from "../../../server/auth.ts"

export const ALL: APIRoute = ({ request }) => getAuth(request).handler(request)
