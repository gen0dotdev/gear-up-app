/// <reference types="@cloudflare/vitest-plugin/types" />
// Binding ที่มีเฉพาะตอน Test (vitest.config.ts ใส่ให้)
declare namespace Cloudflare {
  interface Env {
    TEST_MIGRATIONS: import("@cloudflare/vitest-plugin").D1Migration[]
    TEST_SEED: import("@cloudflare/vitest-plugin").D1Migration[]
  }
}
