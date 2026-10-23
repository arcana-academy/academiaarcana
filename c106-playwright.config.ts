import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/c106-visual",
  timeout: 50000,
  retries: 0,
  fullyParallel: false,
  reporter: [["list"]],
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3106", headless: true },
});
