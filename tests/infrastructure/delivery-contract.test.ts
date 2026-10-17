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

  it("keeps independent production smoke attempts from cancelling one another", () => {
    const workflow = readRepoFile(".github/workflows/production-smoke.yml");

    // A release triggered by the same upstream Quality Gate can finish with its
    // deploy job skipped; it must never cancel an in-flight Git-backed smoke.
    expect(workflow).not.toMatch(/^concurrency:/m);

    // Cover workflow-level and jobs.<name>.concurrency declarations, including
    // quoted values and expressions that may evaluate to true. Only explicit
    // false values are non-cancelling.
    const canCancelAnActiveSmoke = (source: string) =>
      source.split(/\r?\n/).some((line) => {
        const declaration = /^[ \t]*cancel-in-progress[ \t]*:[ \t]*(.*)$/i.exec(line);
        if (!declaration) return false;

        return !/^(?:false|"false"|'false'|\$\{\{\s*false\s*\}\})(?:[ \t]+#.*)?$/i.test(
          declaration[1].trim(),
        );
      });

    expect(canCancelAnActiveSmoke(workflow)).toBe(false);

    for (const value of [
      "false",
      '"false"',
      "'false'",
      '${{ false }}',
      "false # disabled",
    ]) {
      const config = [
        "jobs:",
        "  smoke:",
        "    concurrency:",
        "      group: smoke",
        `      cancel-in-progress: ${value}`,
      ].join("\n");

      expect(canCancelAnActiveSmoke(config)).toBe(false);
    }

    for (const value of [
      "true",
      '"true"',
      "'true'",
      '${{ inputs.cancel_smoke }}',
      "",
    ]) {
      const config = [
        "jobs:",
        "  smoke:",
        "    concurrency:",
        "      group: smoke",
        `      cancel-in-progress: ${value}`,
      ].join("\n");

      expect(canCancelAnActiveSmoke(config)).toBe(true);
    }

    expect(
      canCancelAnActiveSmoke("concurrency:\n  group: smoke\n  cancel-in-progress: true"),
    ).toBe(true);
    expect(workflow).toContain('workflows: ["Academia Arcana Quality Gate", "Academia Arcana Image Release"]');
    expect(workflow).toContain("github.event.workflow_run.name == 'Academia Arcana Image Release'");
    expect(workflow).toContain("github.event.workflow_run.name == 'Academia Arcana Quality Gate'");

    // An authorized operator can manually smoke the *actual deployed* revision
    // while main is ahead and Git auto-deploy is deliberately frozen.
    expect(workflow).toContain("expected_revision:");
    expect(workflow).toContain(
      "inputs.expected_revision || github.event.workflow_run.head_sha || github.sha",
    );
    expect(workflow).toContain('[[ "$expected" =~ ^[0-9a-f]{40}$ ]]');
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
    expect(workflow).toContain("UPSTREAM_RESULT: ${{ github.event.workflow_run.conclusion }}");
    expect(workflow).toContain("UPSTREAM_EVENT: ${{ github.event.workflow_run.event }}");
    expect(workflow).toContain("UPSTREAM_BRANCH: ${{ github.event.workflow_run.head_branch }}");
    expect(workflow).toContain("UPSTREAM_REPOSITORY: ${{ github.event.workflow_run.head_repository.full_name }}");
    expect(workflow).toContain("UPSTREAM_ATTEMPT: ${{ github.event.workflow_run.run_attempt }}");
    expect(workflow).toContain("needs: preflight");
    expect(workflow).toContain("Reject stale main revision before publishing");
    expect(workflow).toContain("Reject stale main revision before deployment");
    expect(workflow).toContain("https://api.render.com/deploy/*");
    expect(workflow).toContain('--proto "=https"');
    expect(workflow).toContain("academiaarcana-deploy-request");
    expect(workflow).toContain("packages: write");
    expect(workflow).toContain("steps.publish_image.outputs.image_url");
    expect(workflow).toContain("UPSTREAM_RUN_ID:");
    expect(workflow).toContain('unique_tag="${image}:${IMAGE_REVISION}-run-${UPSTREAM_RUN_ID}"');
    expect(workflow).toContain("digest: (sha256:[0-9a-f]{64})");
    expect(workflow).toContain("image_url=%s@%s");
    expect(workflow).toContain("IMAGE_URL: ${{ needs.publish.outputs.image_url }}");
    expect(workflow).toContain("imgURL=$IMAGE_URL");
    expect(workflow).toContain("vars.RENDER_IMAGE_DEPLOY_ENABLED == 'true'");
    expect(workflow).toContain("secrets.RENDER_DEPLOY_HOOK_URL");
    expect(workflow).not.toContain("docker build");
  });

  it("requires a nonempty exact main source SHA approval before GHCR publishing", () => {
    const workflow = readRepoFile(".github/workflows/image-release.yml");
    const publishJob = workflow.split("\n  publish:\n")[1]?.split("\n  deploy:\n")[0];

    expect(publishJob).toBeDefined();
    expect(publishJob).toContain("needs: preflight");
    expect(publishJob).toContain("vars.GHCR_PUBLISH_APPROVED_SHA != ''");
    expect(publishJob).toContain(
      "vars.GHCR_PUBLISH_APPROVED_SHA == needs.preflight.outputs.release_sha",
    );
    expect(publishJob).toContain("needs.preflight.result == 'success'");
    expect(publishJob).toContain("packages: write");

    // A missing approval variable must result in a skipped publisher.
    // Deploy authorization is a separate, additional gate.
    expect(workflow).toContain("vars.RENDER_IMAGE_DEPLOY_ENABLED == 'true'");
    expect(workflow).toContain("needs: [preflight, publish]");
  });

  it("requires a separate run-specific gate for every Render deployment", () => {
    const workflow = readRepoFile(".github/workflows/image-release.yml");
    const deployJob = workflow.split("\n  deploy:\n")[1];

    expect(deployJob).toBeDefined();
    expect(deployJob).toContain("needs: [preflight, publish]");
    expect(deployJob).toContain("vars.RENDER_IMAGE_DEPLOY_ENABLED == 'true'");
    expect(deployJob).toContain("vars.RENDER_DEPLOY_APPROVED_RUN_ID != ''");
    expect(deployJob).toContain(
      "vars.RENDER_DEPLOY_APPROVED_RUN_ID == format('{0}', github.run_id)",
    );
    expect(deployJob).toContain("github.run_attempt == 1");
    expect(deployJob).toContain("github.event_name == 'workflow_dispatch'");
    expect(deployJob).toContain("name: render-production-approval");
    expect(deployJob).toContain("permissions: {}");
    expect(deployJob).toContain("secrets.RENDER_DEPLOY_HOOK_URL");
  });

  it("promotes only an authenticated original push-to-main Quality Gate artifact", () => {
    const workflow = readRepoFile(".github/workflows/image-release.yml");
    const preflight = workflow.split("\n  preflight:\n")[1]?.split("\n  publish:\n")[0];
    const publisher = workflow.split("\n  publish:\n")[1]?.split("\n  deploy:\n")[0];
    const deployer = workflow.split("\n  deploy:\n")[1];

    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("approved_revision:");
    expect(workflow).toContain("quality_run_id:");
    expect(preflight).toContain("actions: read");
    expect(preflight).toContain('if [ "$RELEASE_EVENT" = "workflow_run" ]; then');
    expect(preflight).toContain('elif [ "$RELEASE_EVENT" = "workflow_dispatch" ]; then');
    expect(preflight).toContain('if [ "$RELEASE_REF" != "refs/heads/main" ]; then');
    expect(preflight).toContain('gh api "/repos/${GITHUB_REPOSITORY}/actions/runs/${run_id}"');
    expect(preflight).toContain('.name == "Academia Arcana Quality Gate"');
    expect(preflight).toContain('.event == "push"');
    expect(preflight).toContain('.head_branch == "main"');
    expect(preflight).toContain('.head_sha == $revision');
    expect(preflight).toContain('.head_repository.full_name == $repository');
    expect(preflight).toContain('.repository.full_name == $repository');
    expect(preflight).toContain('.run_attempt == 1');
    expect(preflight).toContain('.conclusion == "success"');
    expect(preflight).toContain('upstream_run_id=%s');
    expect(publisher).toContain("name: academiaarcana-image-${{ needs.preflight.outputs.release_sha }}");
    expect(publisher).toContain("run-id: ${{ needs.preflight.outputs.upstream_run_id }}");
    expect(publisher).toContain("IMAGE_REVISION: ${{ needs.preflight.outputs.release_sha }}");
    expect(publisher).toContain("UPSTREAM_RUN_ID: ${{ needs.preflight.outputs.upstream_run_id }}");
    expect(deployer).toContain("needs: [preflight, publish]");
    expect(deployer).toContain("EXPECTED_REVISION: ${{ needs.preflight.outputs.release_sha }}");
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
      "autoDeployTrigger: off",
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

    expect(blueprint).not.toContain("autoDeployTrigger: checksPass");
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
