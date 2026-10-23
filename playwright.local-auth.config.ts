import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

// Authenticated synthetic UI exercises must use the local dev server.
// The production build requires hosted HTTPS config and must never be
// weakened to accommodate localhost test credentials.
if (process.env.AA_LOCAL_SUPABASE_E2E !== "1") {
  throw new Error("Local authenticated E2E requires AA_LOCAL_SUPABASE_E2E=1.");
}

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    // Trust only the disposable localhost certificate in this test context.
    // The app's Content-Security-Policy remains enforced.
    ignoreHTTPSErrors: true,
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000/login",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
