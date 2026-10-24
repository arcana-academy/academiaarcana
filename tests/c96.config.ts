import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./c96",
  testMatch: "preview-contrast.spec.ts",
  retries: 0, workers: 1, timeout: 30_000, reporter: "line",
  use: { baseURL: "http://127.0.0.1:3000", ...devices["Desktop Chrome"], channel: "chrome" },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000/c96-preview",
    reuseExistingServer: false, timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_AAAAAAAAAA_BBBBBBBBBBB_CCCCCCCC",
    },
  },
});
