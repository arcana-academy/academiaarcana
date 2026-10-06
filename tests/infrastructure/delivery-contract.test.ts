import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CANONICAL_INFRASTRUCTURE_PROVIDERS,
  CANONICAL_INFRASTRUCTURE_RULE,
} from "@/core/architecture/provider-policy";

const root = process.cwd();

const readRepoFile = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("delivery infrastructure contract", () => {
  it("restricts workflow_run smoke checks to successful Quality Gate runs on main", () => {
    const workflow = readRepoFile(".github/workflows/production-smoke.yml");

    expect(workflow).toContain('workflows: ["Academia Arcana Quality Gate"]');
    expect(workflow).toContain("types: [completed]");
    expect(workflow).toContain("    branches:\n      - main");
    expect(workflow).toContain("    if: ${{ github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success' }}");
    expect(workflow).not.toContain("github.event.workflow_run.head_branch == 'main'");
  });

  it("defines one canonical provider for each infrastructure responsibility", () => {
    const roles = CANONICAL_INFRASTRUCTURE_PROVIDERS.map((item) => item.role);

    expect(new Set(roles).size).toBe(4);
    expect(CANONICAL_INFRASTRUCTURE_PROVIDERS).toHaveLength(4);
    expect(CANONICAL_INFRASTRUCTURE_RULE).toContain("one canonical platform");
    expect(CANONICAL_INFRASTRUCTURE_PROVIDERS.map((item) => item.provider)).toEqual([
      "GitHub",
      "GitHub Actions",
      "Render",
      "Supabase",
    ]);
  });

  it("has no active legacy hosting configuration", () => {
    expect(existsSync(resolve(root, "netlify.toml"))).toBe(false);
    expect(existsSync(resolve(root, ".github/workflows/nextjs.yml"))).toBe(false);
  });

  it("targets Render from the production smoke workflow", () => {
    const workflow = readRepoFile(".github/workflows/production-smoke.yml");

    expect(workflow).toContain("https://academiaarcana.onrender.com");
    expect(workflow).not.toMatch(/Netlify/i);
  });

  it("declares the canonical Render web service contract", () => {
    const blueprint = readRepoFile("render.yaml");

    for (const expected of [
      "name: academiaarcana",
      "type: web",
      "runtime: node",
      "branch: main",
      "autoDeployTrigger: checksPass",
      "buildCommand: node scripts/verify-dependency-lifecycle-scripts.cjs && npm ci --ignore-scripts && npm rebuild esbuild unrs-resolver --ignore-scripts=false && npm run build",
      "startCommand: npm start",
      "healthCheckPath: /api/health",
      "NPM_CONFIG_IGNORE_SCRIPTS",
      'value: "true"',
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "sync: false",
    ]) {
      expect(blueprint).toContain(expected);
    }

    expect(blueprint).not.toMatch(/service_role|sb_secret_/i);
    expect(blueprint).not.toMatch(/Netlify/i);
  });

  it("keeps deployment metadata provider-neutral", () => {
    const activeFiles = [
      "scripts/verify-public-runtime-config.mjs",
      "honeybadger.browser.config.js",
      "honeybadger.edge.config.js",
      "honeybadger.server.config.js",
    ];

    for (const path of activeFiles) {
      const content = readRepoFile(path);
      expect(content).not.toMatch(/NETLIFY/i);
    }
  });

  it("blocks equivalent hosting and CI platforms from active delivery files", () => {
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
});
