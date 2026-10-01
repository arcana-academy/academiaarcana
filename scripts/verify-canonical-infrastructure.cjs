/* eslint-disable @typescript-eslint/no-require-imports */

(() => {
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
    "ci-cd": [
      ".github/workflows/quality.yml",
      ".github/workflows/production-smoke.yml",
      ".github/workflows/autofix.yml",
    ],
    "application-runtime": [
      ".gitignore",
      "package.json",
      "next.config.ts",
      "render.yaml",
      "src/core/config/deployment-platform.ts",
    ],
    "data-backend": [
      "package.json",
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
    /\\.vercel\\.app/i,
    /\\.netlify\\.app/i,
    /\\.railway\\.app/i,
    /\\.fly\\.dev/i,
    /\\.herokuapp\\.com/i,
    /\\.pages\\.dev/i,
    /\\.workers\\.dev/i,
  ];

  /**
   * Fail the canonical infrastructure contract with a precise diagnostic.
   * @param {string} message Violation details.
   * @returns {never} This function always throws.
   */
  function fail(message) {
    throw new Error(`Canonical infrastructure contract violation: ${message}`);
  }

  /**
   * Read a required repository file as UTF-8 text.
   * @param {string} relativePath Repository-relative file path.
   * @returns {string} File contents.
   */
  function readRepoFile(relativePath) {
    const file = resolve(root, relativePath);
    if (!existsSync(file) || !statSync(file).isFile()) {
      fail(`missing active file: ${relativePath}`);
    }
    return readFileSync(file, "utf8");
  }

  /**
   * Assert that an active configuration surface contains no excluded provider.
   * @param {string} content Configuration content to inspect.
   * @param {string} relativePath Repository-relative path.
   * @param {string} role Infrastructure responsibility being checked.
   * @returns {void} Returns when the content is valid.
   */
  function assertNoForbiddenProvider(content, relativePath, role) {
    const lowered = content.toLowerCase();
    assertNoForbiddenProviderName(lowered, relativePath, role);
    assertNoForbiddenHostingUrl(content, relativePath);
    assertNoForbiddenEnvironmentPrefix(content, relativePath);
  }

  /**
   * Check provider names for a single infrastructure role.
   * @param {string} loweredContent Lower-cased configuration content.
   * @param {string} relativePath Repository-relative path.
   * @param {string} role Infrastructure responsibility being checked.
   * @returns {void} Returns when no excluded provider is found.
   */
  function assertNoForbiddenProviderName(
    loweredContent,
    relativePath,
    role,
  ) {
    for (const provider of PROVIDER_RULES[role]) {
      if (loweredContent.includes(provider.toLowerCase())) {
        fail(
          `${provider} found in active ${role} surface: ${relativePath}`,
        );
      }
    }
  }

  /**
   * Check for known hostnames belonging to excluded providers.
   * @param {string} content Configuration content to inspect.
   * @param {string} relativePath Repository-relative path.
   * @returns {void} Returns when no excluded hostname is found.
   */
  function assertNoForbiddenHostingUrl(content, relativePath) {
    for (const pattern of FORBIDDEN_HOST_PATTERNS) {
      if (pattern.test(content)) {
        fail(
          `forbidden hosting URL pattern found in active runtime surface: ${relativePath}`,
        );
      }
    }
  }

  /**
   * Check for environment variable prefixes owned by excluded providers.
   * @param {string} content Configuration content to inspect.
   * @param {string} relativePath Repository-relative path.
   * @returns {void} Returns when no excluded environment prefix is found.
   */
  function assertNoForbiddenEnvironmentPrefix(content, relativePath) {
    for (const prefix of FORBIDDEN_ENV_PREFIXES) {
      if (content.includes(prefix)) {
        fail(
          `forbidden environment variable prefix ${prefix} found in active runtime surface: ${relativePath}`,
        );
      }
    }
  }

  /**
   * Alias for the environment-prefix validator kept separate for clarity.
   * @param {string} content Configuration content to inspect.
   * @param {string} relativePath Repository-relative path.
   * @returns {void} Returns when the environment configuration is valid.
   */
  function assertNoForbiddenEnvironment(content, relativePath) {
    assertNoForbiddenEnvironmentPrefix(content, relativePath);
  }

  /**
   * Recursively collect workflow configuration files.
   * @param {string} relativeDir Repository-relative directory.
   * @returns {string[]} Repository-relative workflow file paths.
   */
  function walkFiles(relativeDir) {
    const absoluteDir = resolve(root, relativeDir);
    if (!existsSync(absoluteDir)) return [];

    const files = [];
    for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
      const relativePath = resolve(relativeDir, entry.name)
        .replaceAll("\\\\", "/");

      if (entry.isDirectory()) {
        files.push(...walkFiles(relativePath));
      } else if (/\\.(ya?ml|json|yaml)$/i.test(entry.name)) {
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

  if (existsSync(resolve(root, ".env.example"))) {
    assertNoForbiddenProvider(
      readRepoFile(".env.example"),
      ".env.example",
      "application-runtime",
    );
  }

  for (const workflowPath of walkFiles(".github/workflows")) {
    const content = readRepoFile(workflowPath);
    assertNoForbiddenProvider(
      content,
      workflowPath,
      "application-runtime",
    );
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
    const loweredDependency = dependencyName.toLowerCase();
    for (const token of FORBIDDEN_DEPENDENCY_TOKENS) {
      if (loweredDependency.includes(token.toLowerCase())) {
        fail(`forbidden infrastructure dependency ${dependencyName}`);
      }
    }
  }

  const renderConfig = readRepoFile("render.yaml");
  const requiredRenderDirectives = [
    "type: web",
    "name: academiaarcana",
    "runtime: node",
    "branch: main",
    "autoDeployTrigger: checksPass",
    "buildCommand: npm ci && npm run build",
    "startCommand: npm start",
    "healthCheckPath: /api/health",
  ];

  for (const required of requiredRenderDirectives) {
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
    "Canonical infrastructure contract verified: GitHub + GitHub Actions + Render + Supabase.\\n",
  );
})();
