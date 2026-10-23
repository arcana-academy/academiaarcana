import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./c88",
  testMatch: "system-first-paint.spec.ts",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:3000", ...devices["Desktop Chrome"] },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000/c88-firstpaint",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_AAAAAAAAAA_BBBBBBBBBBB_CCCCCCCC",
    },
  },
});
