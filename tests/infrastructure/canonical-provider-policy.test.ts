import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CANONICAL_INFRASTRUCTURE_PROVIDERS,
  CANONICAL_INFRASTRUCTURE_RULE,
} from "@/core/architecture/provider-policy";

const root = process.cwd();

const readRepoFile = (path: string) =>
  readFileSync(resolve(root, path), "utf8");

describe("canonical infrastructure provider policy", () => {
  it("defines exactly one canonical platform for each infrastructure role", () => {
    const roles = CANONICAL_INFRASTRUCTURE_PROVIDERS.map(
      (item) => item.role,
    );

    expect(new Set(roles).size).toBe(4);
    expect(CANONICAL_INFRASTRUCTURE_PROVIDERS).toHaveLength(4);
    expect(CANONICAL_INFRASTRUCTURE_RULE).toContain(
      "one canonical platform",
    );
    expect(CANONICAL_INFRASTRUCTURE_PROVIDERS.map((item) => item.provider)).toEqual([
      "GitHub",
      "GitHub Actions",
      "Render",
      "Supabase",
    ]);
  });

  it("keeps the executable infrastructure guard synchronized with policy", () => {
    const guard = readRepoFile("scripts/verify-canonical-infrastructure.cjs");

    for (const item of CANONICAL_INFRASTRUCTURE_PROVIDERS) {
      for (const provider of item.disallowedAlternatives) {
        expect(guard).toContain(provider);
      }
    }
  });

  it("keeps active runtime configuration provider-neutral", () => {
    const activeFiles = [
      "scripts/verify-public-runtime-config.mjs",
      "honeybadger.browser.config.js",
      "honeybadger.edge.config.js",
      "honeybadger.server.config.js",
      "next.config.ts",
    ];

    for (const path of activeFiles) {
      const content = readRepoFile(path);
      expect(content).not.toMatch(/VERCEL/i);
      expect(content).not.toMatch(/NETLIFY/i);
    }
  });

  it("keeps canonical delivery files free of competing infrastructure providers", () => {
    const activeFiles = [
      ".github/workflows/quality.yml",
      ".github/workflows/production-smoke.yml",
      "render.yaml",
      "package.json",
      ".gitignore",
      "next.config.ts",
    ];

    const forbidden = CANONICAL_INFRASTRUCTURE_PROVIDERS.flatMap(
      (item) => item.disallowedAlternatives,
    );

    for (const path of activeFiles) {
      const content = readRepoFile(path);

      for (const provider of forbidden) {
        expect(content).not.toContain(provider);
      }
    }
  });

  it("keeps the Render service as the only application runtime in repository configuration", () => {
    const render = readRepoFile("render.yaml");

    expect(render).toContain("name: academiaarcana");
    expect(render).toContain("type: web");
    expect(render).toContain("runtime: node");
    expect(render).toContain("branch: main");
    expect(render).toContain("buildCommand: node scripts/verify-dependency-lifecycle-scripts.cjs && npm ci --ignore-scripts && npm rebuild esbuild unrs-resolver --ignore-scripts=false && npm run build");
    expect(render).toContain("startCommand: npm start");
    expect(render).toContain("healthCheckPath: /api/health");
  });

  it("preserves the Supabase role as the application data backend", () => {
    const render = readRepoFile("render.yaml");

    expect(render).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(render).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });
});
