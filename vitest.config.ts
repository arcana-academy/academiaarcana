import { fileURLToPath, URL } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    exclude: [
      // Keep Vitest's own defaults (**/node_modules/**, **/.git/**): setting
      // "exclude" replaces them instead of extending them.
      ...configDefaults.exclude,
      // Parallel, git-ignored working copies of this repository that live next
      // to the source tree (see .gitignore). They carry their own src/ and
      // node_modules, so they must never be collected as project tests.
      "**/academiaarcana-clean/**",
      // Playwright owns the end-to-end suite (see playwright.config.ts,
      // testDir "./tests/e2e"). Anchored with "**/" so no copy of the tree can
      // smuggle a spec file back into the Vitest run.
      "**/tests/e2e/**",
    ],
  },
});
