import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readRepoFile(path: string) {
  return readFileSync(resolve(root, path), "utf8");
}

describe("delivery infrastructure contract", () => {
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
    expect(blueprint).toContain("autoDeployTrigger: checksPass");
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
    }
  });
});
