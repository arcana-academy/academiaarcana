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
  it("retains git-source smoke until the image deployment switch is enabled", () => {
    const workflow = readRepoFile(".github/workflows/production-smoke.yml").replaceAll(
      "\r\n",
      "\n",
    );

    expect(workflow).toContain('workflows: ["Academia Arcana Quality Gate", "Academia Arcana Image Release"]');
    expect(workflow).toContain("types: [completed]");
    expect(workflow).toContain("    branches:\n      - main");
    expect(workflow).toContain("github.event.workflow_run.head_repository.full_name == github.repository");
    expect(workflow).toContain("github.event.workflow_run.event == 'push'");
    expect(workflow).toContain("github.event.workflow_run.name == 'Academia Arcana Quality Gate'");
    expect(workflow).toContain("github.event.workflow_run.name == 'Academia Arcana Image Release'");
    expect(workflow).toContain("vars.RENDER_IMAGE_DEPLOY_ENABLED != 'true'");
    expect(workflow).toContain("vars.RENDER_IMAGE_DEPLOY_ENABLED == 'true'");
    expect(workflow).toContain("if: github.event_name == 'workflow_run' && github.event.workflow_run.name == 'Academia Arcana Image Release'");
    expect(workflow).toContain("academiaarcana-deploy-request");
  });

  it("validates workflow-derived production revisions before shell use", () => {
    const workflow = readRepoFile(".github/workflows/production-smoke.yml");

    expect(workflow).toContain("EXPECTED_COMMIT: ${{ steps.expected.outputs.commit }}");
    expect(workflow).toContain('expected_commit="$EXPECTED_COMMIT"');
    expect(workflow).toContain('[[ "$expected" =~ ^[0-9a-f]{40}$ ]]');
    expect(workflow).toContain('if [ "$EVENT_NAME" = "workflow_run" ] && [ "$TRIGGER_WORKFLOW" = "Academia Arcana Image Release" ]; then');
    expect(workflow).not.toContain('expected_commit="${{ steps.expected.outputs.commit }}"');
  });

  it("publishes only the image artifact built by a successful main Quality Gate", () => {
    const workflow = readRepoFile(".github/workflows/image-release.yml");

    expect(workflow).toContain('workflows: ["Academia Arcana Quality Gate"]');
    expect(workflow).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(workflow).toContain("github.event.workflow_run.event == 'push'");
    expect(workflow).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(workflow).toContain("github.event.workflow_run.head_repository.full_name == github.repository");
    expect(workflow).toContain("github.event.workflow_run.run_attempt == 1");
    expect(workflow).toContain("needs: preflight");
    expect(workflow).toContain("Reject stale main revision before publishing");
    expect(workflow).toContain("Reject stale main revision before deployment");
    expect(workflow).toContain("https://api.render.com/deploy/*");
    expect(workflow).toContain('--proto "=https"');
    expect(workflow).toContain("academiaarcana-deploy-request");
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

  it("builds the image without local environment files or runtime secrets", () => {
    const dockerfile = readRepoFile("Dockerfile");
    const dockerignore = readRepoFile(".dockerignore");
    const quality = readRepoFile(".github/workflows/quality.yml");

    expect(dockerignore).toContain(".env.*");
    expect(dockerignore).toContain("*.pem");
    expect(dockerignore).toContain("*.key");
    expect(dockerfile).toContain("AS builder");
    expect(dockerfile).toContain("AS runtime");
    expect(dockerfile).toContain("npm prune --omit=dev --ignore-scripts");
    expect(dockerfile).toContain("COPY --from=builder --chown=node:node /app /app");
    expect(dockerfile).toContain("USER node");
    expect(dockerfile).toContain("ARG NEXT_PUBLIC_HONEYBADGER_API_KEY");
    expect(dockerfile).toContain("ARG NEXT_PUBLIC_HONEYBADGER_ASSETS_URL");
    expect(quality).toContain("vars.NEXT_PUBLIC_HONEYBADGER_API_KEY");
    expect(quality).toContain("vars.NEXT_PUBLIC_HONEYBADGER_ASSETS_URL");
    expect(dockerfile).toContain("ARG NEXT_PUBLIC_SUPABASE_URL");
    expect(dockerfile).toContain("ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(dockerfile).toContain("ARG ACADEMIA_ARCANA_REVISION");
    expect(quality).toContain("docker build --platform linux/amd64");
    expect(quality).toContain("name: Verify production public configuration");
    expect(quality).toContain("node scripts/verify-public-runtime-config.mjs");
    expect(quality).not.toContain("secrets.");
  });

  it("starts the built runtime image before permitting a main image artifact", () => {
    const workflow = readRepoFile(".github/workflows/quality.yml");
    const smoke = readRepoFile("scripts/smoke-production-container.sh");

    expect(workflow).toContain("Smoke test isolated production image");
    expect(workflow.indexOf("Smoke test isolated production image")).toBeGreaterThan(
      workflow.indexOf("Build production image"),
    );
    expect(workflow.indexOf("Smoke test isolated production image")).toBeLessThan(
      workflow.indexOf("Save production image artifact"),
    );
    expect(smoke).toContain("docker run --detach --rm");
    expect(smoke).toContain("--cap-drop ALL");
    expect(smoke).toContain("no-new-privileges");
    expect(smoke).toContain("docker exec");
    expect(smoke).toContain("OPENAI_API_KEY");
    expect(smoke).toContain("/api/health");
    expect(smoke).toContain("response.revision !== revision");
    expect(smoke).toContain("docker rm --force");
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
