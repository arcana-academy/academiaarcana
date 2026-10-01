/* eslint-disable @typescript-eslint/no-require-imports */

const {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} = require("node:fs");
const { resolve } = require("node:path");

const root = process.cwd();

const PROVIDER_RULES = {
  "source-control": [
    "GitLab",
    "Bitbucket",
    "Codeberg",
    "Azure Repos",
  ],
  "ci-cd": [
    "GitLab CI/CD",
    "CircleCI",
    "Travis CI",
    "Jenkins",
    "Bitbucket Pipelines",
    "Azure Pipelines",
    "Buildkite",
  ],
  "application-runtime": [
    "Vercel",
    "Netlify",
    "GitHub Pages",
    "Railway",
    "Fly.io",
    "Heroku",
    "AWS App Runner",
    "AWS Amplify",
    "Cloudflare Pages",
    "Cloudflare Workers",
    "DigitalOcean App Platform",
    "Google Cloud Run",
    "Azure Static Web Apps",
    "AppDeploy",
    "Hatchable",
    "Hercules",
    "Floot",
    "Replit",
    "Base44",
    "Lovable",
    "Webflow",
    "Wix",
  ],
  "data-backend": [
    "Firebase",
    "Appwrite",
    "PocketBase",
    "Neon",
    "Convex",
    "PlanetScale",
  ],
};

const ACTIVE_SURFACES = {
  "source-control": [
    "README.md",
    "docs/engineering/technical-baseline.md",
  ],
  "ci-cd": [
    ".github/workflows/quality.yml",
    ".github/workflows/production-smoke.yml",
    "README.md",
  ],
  "application-runtime": [
    ".gitignore",
    "README.md",
    "package.json",
    "next.config.ts",
    "render.yaml",
    "docs/deployment/render.md",
    "docs/engineering/technical-baseline.md",
    "docs/integrations/final-integration-state.md",
    "src/core/config/deployment-platform.ts",
    "src/infrastructure/integrations/arcana-tool-map.ts",
  ],
};

const FORBIDDEN_PATHS = [
  "vercel.json",
  "netlify.toml",
  ".vercel",
  ".netlify",
  "public/_redirects",
  "public/_headers",
  "netlify/functions",
  "railway.json",
  "railway.toml",
  "fly.toml",
  "Procfile",
  "wrangler.toml",
  "wrangler.json",
  "firebase.json",
  "appwrite.json",
  ".gitlab-ci.yml",
  ".circleci",
  ".travis.yml",
  "Jenkinsfile",
  "bitbucket-pipelines.yml",
  "azure-pipelines.yml",
  ".buildkite",
];

const FORBIDDEN_DEPENDENCY_TOKENS = [
  "@vercel/",
  "vercel",
  "@netlify/",
  "netlify-cli",
  "netlify",
  "firebase",
  "appwrite",
  "pocketbase",
  "@railway/",
  "railway",
  "fly.io",
  "heroku",
  "wrangler",
];

const FORBIDDEN_ENV_PREFIXES = [
  "VERCEL_",
  "NETLIFY_",
  "RAILWAY_",
  "FLY_",
  "HEROKU_",
  "FIREBASE_",
  "APPWRITE_",
  "POCKETBASE_",
];

const FORBIDDEN_HOST_PATTERNS = [
  /\.vercel\.app/i,
  /\.netlify\.app/i,
  /\.railway\.app/i,
  /\.fly\.dev/i,
  /\.herokuapp\.com/i,
  /\.pages\.dev/i,
  /\.workers\.dev/i,
];

function fail(message) {
  throw new Error(`Canonical infrastructure contract violation: ${message}`);
}

function readRepoFile(relativePath) {
  const file = resolve(root, relativePath);
  if (!existsSync(file) || !statSync(file).isFile()) {
    fail(`missing active file: ${relativePath}`);
  }
  return readFileSync(file, "utf8");
}

function assertNoForbiddenProvider(content, relativePath, role) {
  for (const provider of PROVIDER_RULES[role]) {
    if (content.toLowerCase().includes(provider.toLowerCase())) {
      fail(`${provider} found in active ${role} surface: ${relativePath}`);
    }
  }

  for (const pattern of FORBIDDEN_HOST_PATTERNS) {
    if (pattern.test(content)) {
      fail(`forbidden hosting URL pattern found in active ${role} surface: ${relativePath}`);
    }
  }

  for (const prefix of FORBIDDEN_ENV_PREFIXES) {
    if (content.includes(prefix)) {
      fail(`forbidden environment variable prefix ${prefix} found in active ${role} surface: ${relativePath}`);
    }
  }
}

function walkFiles(relativeDir) {
  const absoluteDir = resolve(root, relativeDir);
  if (!existsSync(absoluteDir)) return [];

  const files = [];
  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    const relativePath = resolve(relativeDir, entry.name)
      .replaceAll("\\", "/");

    if (entry.isDirectory()) {
      files.push(...walkFiles(relativePath));
    } else if (/\.(ya?ml|json|yaml)$/i.test(entry.name)) {
      files.push(relativePath);
    }
  }
  return files;
}

for (const relativePath of FORBIDDEN_PATHS) {
  if (existsSync(resolve(root, relativePath))) {
    fail(`forbidden provider configuration path exists: ${relativePath}`);
  }
}

for (const [role, paths] of Object.entries(ACTIVE_SURFACES)) {
  for (const relativePath of paths) {
    assertNoForbiddenProvider(
      readRepoFile(relativePath),
      relativePath,
      role,
    );
  }
}

const optionalEnvironmentFiles = [".env.example"];
for (const relativePath of optionalEnvironmentFiles) {
  if (existsSync(resolve(root, relativePath))) {
    const content = readFileSync(resolve(root, relativePath), "utf8");
    assertNoForbiddenProvider(content, relativePath, "application-runtime");
  }
}

const workflowFiles = walkFiles(".github/workflows");
for (const workflowPath of workflowFiles) {
  const content = readRepoFile(workflowPath);
  assertNoForbiddenProvider(content, workflowPath, "application-runtime");
  assertNoForbiddenProvider(content, workflowPath, "ci-cd");
}

const packageJson = JSON.parse(readRepoFile("package.json"));
const dependencyEntries = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
  ...(packageJson.optionalDependencies ?? {}),
  ...(packageJson.peerDependencies ?? {}),
};

for (const dependencyName of Object.keys(dependencyEntries)) {
  const lowered = dependencyName.toLowerCase();

  for (const token of FORBIDDEN_DEPENDENCY_TOKENS) {
    if (lowered.includes(token.toLowerCase())) {
      fail(`forbidden infrastructure dependency ${dependencyName}`);
    }
  }
}

const renderConfig = readRepoFile("render.yaml");
for (const required of [
  "type: web",
  "name: academiaarcana",
  "runtime: node",
  "branch: main",
  "autoDeployTrigger: checksPass",
  "buildCommand: npm ci && npm run build",
  "startCommand: npm start",
  "healthCheckPath: /api/health",
]) {
  if (!renderConfig.includes(required)) {
    fail(`Render contract missing "${required}"`);
  }
}

const deploymentPlatform = readRepoFile(
  "src/core/config/deployment-platform.ts",
);
if (!deploymentPlatform.includes('DEPLOYMENT_PLATFORM = "render"')) {
  fail("application deployment platform is not locked to Render");
}

process.stdout.write(
  "Canonical infrastructure contract verified: GitHub + GitHub Actions + Render + Supabase.\n",
);
