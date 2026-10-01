const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const root = process.cwd();

const requiredFiles = [
  "render.yaml",
  "src/app/api/health/route.ts",
];

const activeSurfaces = [
  "render.yaml",
  ".github/workflows/production-smoke.yml",
  ".github/workflows/quality.yml",
  "package.json",
  "README.md",
  "docs/architecture/AA-ARCHITECTURE-1.0.md",
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

  const content = readFileSync(file, "utf8");

  if (/vercel/i.test(content)) {
    throw new Error(`Obsolete Vercel reference found in active deployment surface: ${relativePath}`);
  }

  if (/github-pages/i.test(content) || /deploy-pages/i.test(content)) {
    throw new Error(`Obsolete GitHub Pages reference found in active deployment surface: ${relativePath}`);
  }
}

const renderConfig = readFileSync(resolve(root, "render.yaml"), "utf8");
const requiredRenderDirectives = [
  "type: web",
  "runtime: node",
  "branch: main",
  "autoDeployTrigger: checksPass",
  "buildCommand: npm ci && npm run build",
  "startCommand: npm start",
  "healthCheckPath: /api/health",
];

for (const directive of requiredRenderDirectives) {
  if (!renderConfig.includes(directive)) {
    throw new Error(`Render deployment contract is incomplete: missing "${directive}"`);
  }
}

process.stdout.write("Deployment platform contract verified: Render.\n");
