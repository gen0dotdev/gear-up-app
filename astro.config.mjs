// @ts-check
// ตั้งค่า Astro: หน้าเว็บทุกหน้ารันบน Cloudflare Workers (output: "server")
// แล้วเปิดใช้ React (สำหรับ Island ของหลังร้าน) และ Tailwind CSS v4 ผ่าน Vite Plugin
import cloudflare from "@astrojs/cloudflare"
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"

export default defineConfig({
  // "server" = ทุกหน้า Render ตอนมีคำขอ เพราะหน้าร้านแสดงช่องว่างและราคาล่าสุด
  // ซึ่งเปลี่ยนทุกครั้งที่มีคนจองหรือคุณภูมิแก้ราคา จะสร้างเป็นไฟล์นิ่งตอน Build ไม่ได้
  output: "server",
  adapter: cloudflare({
    // รูปบริการมาจาก R2 ผ่าน /photos/[id] ของเราเอง ไม่ได้ใช้ <Image> ของ Astro
    // "passthrough" จึงพอ และไม่ต้องมี Images Binding (รันแบบ Offline ได้)
    imageService: "passthrough",
  }),
  // ไม่ใช้ Session ของ Astro: Session ของการล็อกอินเป็นของ Better Auth (เก็บใน D1)
  // ปิดไว้ Adapter จะไม่สร้าง KV Binding ชื่อ SESSION ให้ ลดของที่ต้องเข้าใจไปหนึ่งอย่าง
  session: false,
  // ปิดแถบเครื่องมือของ Astro ตอน dev: บังปุ่มบนจอมือถือ และผู้เรียนยังไม่ต้องใช้
  devToolbar: { enabled: false },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
})
