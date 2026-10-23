import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./c88",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:3000", ...devices["Desktop Chrome"] },
  webServer: {
    command: "npm run dev -- --webpack --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000/c88-a11y",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_AAAAAAAAAA_BBBBBBBBBBB_CCCCCCCC",
    },
  },
});
