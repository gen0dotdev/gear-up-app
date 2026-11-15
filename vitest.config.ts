// Test รันใน workerd (Runtime เดียวกับ Cloudflare) ด้วย @cloudflare/vitest-plugin
// และได้ D1 ในหน่วยความจำของตัวเอง ไม่แตะ D1 ของ npm run dev
//
// ไม่ชี้ไปที่ wrangler.jsonc: ไฟล์นั้นมี main เป็น Worker ของ Astro ซึ่ง Test ไม่ต้องใช้
// จึงบอก Binding ที่ Test ใช้ตรงนี้: DB (D1) + ไฟล์ Migration และข้อมูลตัวอย่างที่อ่านจากดิสก์
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin"
import { defineConfig } from "vitest/config"

export default defineConfig(async () => {
  const migrations = await readD1Migrations("./migrations")
  const seed = await readD1Migrations("./seed")
  return {
    plugins: [
      cloudflareTest({
        miniflare: {
          compatibilityDate: "2026-11-01",
          compatibilityFlags: ["nodejs_compat"],
          d1Databases: ["DB"],
          bindings: { TEST_MIGRATIONS: migrations, TEST_SEED: seed },
        },
      }),
    ],
    test: {
      include: ["tests/**/*.test.ts"],
      setupFiles: ["./tests/setup.ts"],
    },
  }
})
