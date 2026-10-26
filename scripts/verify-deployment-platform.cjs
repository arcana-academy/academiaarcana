/* eslint-disable @typescript-eslint/no-require-imports */

const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const root = process.cwd();

const requiredFiles = [
  "render.yaml",
  ".github/workflows/image-release.yml",
  "src/app/api/health/route.ts",
];

const activeSurfaces = [
  "render.yaml",
  ".github/workflows/production-smoke.yml",
  ".github/workflows/quality.yml",
  ".github/workflows/image-release.yml",
  "package.json",
  "README.md",
  "docs/deployment/render.md",
  "docs/engineering/technical-baseline.md",
  "docs/integrations/final-integration-state.md",
  "src/infrastructure/integrations/arcana-tool-map.ts",
];

for (const relativePath of requiredFiles) {
  if (!existsSync(resolve(root, relativePath))) {
    throw new Error(`Missing required Render deployment file: ${relativePath}`);
  }
}

for (const relativePath of activeSurfaces) {
  const file = resolve(root, relativePath);
  if (!existsSync(file)) {
    throw new Error(`Missing active deployment surface: ${relativePath}`);
  }

  const fileContent = readFileSync(file, "utf8");

  if (/github-pages/i.test(fileContent) || /deploy-pages/i.test(fileContent)) {
    throw new Error(
      `Obsolete GitHub Pages reference found in active deployment surface: ${relativePath}`,
    );
  }
}

const renderConfig = readFileSync(resolve(root, "render.yaml"), "utf8");
const requiredRenderDirectives = [
  "type: web",
  "runtime: node",
  "branch: main",
  "autoDeployTrigger: off",
  "buildCommand: node scripts/security/assert-build-secret-isolation-536.cjs && node scripts/verify-dependency-lifecycle-scripts.cjs && npm ci --ignore-scripts && npm rebuild unrs-resolver --ignore-scripts=false && npm run build",
  "startCommand: npm start",
  "healthCheckPath: /api/health",
  "key: NPM_CONFIG_IGNORE_SCRIPTS",
  'value: "true"',
];

const triggerEntries = [...renderConfig.matchAll(/^\s*autoDeployTrigger:\s*(\S+)\s*$/gm)].map((match) => match[1]);
if (triggerEntries.length !== 1 || triggerEntries[0] !== "off") {
  throw new Error("Render auto-deploy must have exactly one trigger, set to off.");
}

for (const directive of requiredRenderDirectives) {
  if (!renderConfig.includes(directive)) {
    throw new Error(
      `Render deployment contract is incomplete: missing "${directive}"`,
    );
  }
}

process.stdout.write("Deployment platform contract verified: Render.\n");
