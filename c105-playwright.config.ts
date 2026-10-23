import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/c105-visual",
  timeout: 40000,
  retries: 0,
  fullyParallel: false,
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3105", headless: true, trace: "off" },
  reporter: [["list"]],
});
