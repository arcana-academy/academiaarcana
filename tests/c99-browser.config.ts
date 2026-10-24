import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./c99",
  testMatch: "accessible-editor.spec.ts",
  timeout: 45_000,
  workers: 1,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3000",
    ...devices["Desktop Chrome"],
    channel: "chrome",
    acceptDownloads: true,
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000/c99-accessibility-proof",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_AAAAAAAAAA_BBBBBBBBBBB_CCCCCCCC",
    },
  },
});
