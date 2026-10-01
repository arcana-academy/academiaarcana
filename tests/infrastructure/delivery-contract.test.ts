import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CANONICAL_INFRASTRUCTURE_PROVIDERS,
  CANONICAL_INFRASTRUCTURE_RULE,
} from "@/core/architecture/provider-policy";

const root = process.cwd();

function readRepoFile(path: string) {
  return readFileSync(resolve(root, path), "utf8");
}

describe("delivery infrastructure contract", () => {
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

  it("has no active Vercel configuration", () => {
    expect(existsSync(resolve(root, "vercel.json"))).toBe(false);
  });

  it("has no GitHub Pages deployment workflow", () => {
    expect(
      existsSync(resolve(root, ".github/workflows/nextjs.yml")),
    ).toBe(false);
  });

  it("does not keep Vercel as a local deployment toolchain", () => {
    const gitignore = readRepoFile(".gitignore");

    expect(gitignore).not.toMatch(/^# Vercel\s*$/m);
    expect(gitignore).not.toMatch(/^\.vercel\/?$/m);
  });

  it("targets the Render production service in the smoke workflow", () => {
    const workflow = readRepoFile(".github/workflows/production-smoke.yml");

    expect(workflow).toContain("https://academiaarcana.onrender.com");
    expect(workflow).not.toContain("vercel.app");
    expect(workflow).not.toContain("Vercel");
  });

  it("declares the single production Render web service", () => {
    const blueprint = readRepoFile("render.yaml");

    expect(blueprint).toContain("name: academiaarcana");
    expect(blueprint).toContain("type: web");
    expect(blueprint).toContain("runtime: node");
    expect(blueprint).toContain("plan: free");
    expect(blueprint).toContain("region: ohio");
    expect(blueprint).toContain("branch: main");
    expect(blueprint).toContain("buildCommand: npm ci && npm run build");
    expect(blueprint).toContain("startCommand: npm start");
    expect(blueprint).toContain("healthCheckPath: /");
    expect(blueprint).toContain("autoDeployTrigger: commit");
    expect(blueprint).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(blueprint).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(blueprint).toContain("sync: false");
    expect(blueprint).not.toContain("service_role");
    expect(blueprint).not.toContain("sb_secret_");
  });

  it("keeps active runtime configuration provider-neutral", () => {
    const activeFiles = [
      "scripts/verify-public-runtime-config.mjs",
      "honeybadger.browser.config.js",
      "honeybadger.edge.config.js",
      "honeybadger.server.config.js",
    ];

    for (const path of activeFiles) {
      expect(readRepoFile(path)).not.toMatch(/VERCEL_/);
      expect(readRepoFile(path)).not.toMatch(/NETLIFY/i);
    }
  });

  it("blocks equivalent deployment and CI providers from active infrastructure files", () => {
    const activeFiles = [
      ".github/workflows/quality.yml",
      ".github/workflows/production-smoke.yml",
      "render.yaml",
      "package.json",
      ".gitignore",
      "next.config.ts",
    ];

    const forbidden = [
      "Vercel",
      "Netlify",
      "Railway",
      "Fly.io",
      "Heroku",
      "AWS App Runner",
      "AWS Amplify",
      "Cloudflare Pages",
      "Cloudflare Workers",
      "GitLab CI",
      "CircleCI",
      "Travis CI",
      "Jenkins",
      "Bitbucket Pipelines",
      "Firebase",
      "Appwrite",
      "PocketBase",
    ];

    for (const path of activeFiles) {
      const content = readRepoFile(path);
      for (const provider of forbidden) {
        expect(content).not.toContain(provider);
      }
    }
  });
});
