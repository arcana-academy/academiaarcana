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
  it("restricts workflow_run smoke checks to successful image releases on main", () => {
    const workflow = readRepoFile(".github/workflows/production-smoke.yml").replaceAll(
      "\r\n",
      "\n",
    );

    expect(workflow).toContain('workflows: ["Academia Arcana Image Release"]');
    expect(workflow).toContain("types: [completed]");
    expect(workflow).toContain("    branches:\n      - main");
    expect(workflow).toContain("vars.RENDER_IMAGE_DEPLOY_ENABLED == 'true'");
    expect(workflow).toContain("academiaarcana-deploy-${{ github.event.workflow_run.head_sha }}");
    expect(workflow).not.toContain("github.event.workflow_run.head_branch == 'main'");
  });

  it("keeps workflow-derived production revisions out of inline shell interpolation", () => {
    const workflow = readRepoFile(".github/workflows/production-smoke.yml");

    expect(workflow).toContain("EXPECTED_COMMIT: ${{ steps.expected.outputs.commit }}");
    expect(workflow).toContain('expected_commit="$EXPECTED_COMMIT"');
    expect(workflow).toContain('[[ "$expected" =~ ^[0-9a-f]{40}$ ]]');
    expect(workflow).not.toContain('expected_commit="${{ steps.expected.outputs.commit }}"');
  });

  it("publishes only the image artifact built by a successful main Quality Gate", () => {
    const workflow = readRepoFile(".github/workflows/image-release.yml");

    expect(workflow).toContain('workflows: ["Academia Arcana Quality Gate"]');
    expect(workflow).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(workflow).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(workflow).toContain("packages: write");
    expect(workflow).toContain("ghcr.io/arcana-academy/academiaarcana:${IMAGE_REVISION}");
    expect(workflow).toContain("vars.RENDER_IMAGE_DEPLOY_ENABLED == 'true'");
    expect(workflow).toContain("secrets.RENDER_DEPLOY_HOOK_URL");
    expect(workflow).not.toContain("docker build");
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
      "runtime: image",
      "url: ghcr.io/arcana-academy/academiaarcana:main",
      "plan: free",
      "region: ohio",
      "healthCheckPath: /api/health",
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

  it("builds the image without local environment files or runtime secrets", () => {
    const dockerfile = readRepoFile("Dockerfile");
    const dockerignore = readRepoFile(".dockerignore");
    const quality = readRepoFile(".github/workflows/quality.yml");

    expect(dockerignore).toContain(".env.*");
    expect(dockerfile).toContain("ARG NEXT_PUBLIC_SUPABASE_URL");
    expect(dockerfile).toContain("ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(dockerfile).toContain("ARG ACADEMIA_ARCANA_REVISION");
    expect(quality).toContain("docker build --platform linux/amd64");
    expect(quality).toContain("name: Verify production public configuration");
    expect(quality).toContain("node scripts/verify-public-runtime-config.mjs");
    expect(quality).not.toContain("secrets.");
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
