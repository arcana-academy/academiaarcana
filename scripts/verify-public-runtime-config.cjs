/* eslint-disable @typescript-eslint/no-require-imports */

const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { parseEnv } = require("node:util");

const BUILD_ENV_FILES = [
  ".env.production.local",
  ".env.local",
  ".env.production",
  ".env",
];

const loadBuildEnvironment = (
  baseEnvironment = process.env,
  cwd = process.cwd(),
) => {
  const environment = { ...baseEnvironment };

  for (const filename of BUILD_ENV_FILES) {
    const path = resolve(cwd, filename);

    if (!existsSync(path)) continue;

    const parsed = parseEnv(readFileSync(path, "utf8"));

    for (const [name, value] of Object.entries(parsed)) {
      if (!(name in environment)) environment[name] = value;
    }
  }

  return environment;
}

const validateSupabaseProductionConfiguration = (
  supabaseUrl,
  publishableKey,
) => {
  let parsedUrl = null;

  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS Supabase project URL.",
    );
  }

  const projectRef = parsedUrl.hostname.replace(/\.supabase\.co$/, "");
  const invalidUrl = [
    parsedUrl.protocol !== "https:",
    Boolean(parsedUrl.username),
    Boolean(parsedUrl.password),
    Boolean(parsedUrl.port),
    parsedUrl.pathname !== "/",
    Boolean(parsedUrl.search),
    Boolean(parsedUrl.hash),
    !/^[a-z0-9]{20}$/.test(projectRef),
  ].some(Boolean);

  if (invalidUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS Supabase project URL.",
    );
  }

  if (!/^sb_publishable_[A-Za-z0-9_-]{22}_[A-Za-z0-9_-]{8}$/.test(publishableKey)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must use the expected sb_publishable_<22-char-random>_<8-char-checksum> format.",
    );
  }
}

const verifyPublicRuntimeConfig = (environment = loadBuildEnvironment()) => {
  for (const name of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ]) {
    if (!environment[name]?.trim()) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }

  validateSupabaseProductionConfiguration(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return {
    integration: "supabase-public-runtime",
    verified: true,
    environment: environment.APP_ENV ?? environment.NODE_ENV ?? "unknown",
    configuration: "environment",
  };
}

exports.loadBuildEnvironment = loadBuildEnvironment;
exports.validateSupabaseProductionConfiguration =
  validateSupabaseProductionConfiguration;
exports.verifyPublicRuntimeConfig = verifyPublicRuntimeConfig;

if (require.main === module) {
  process.stdout.write(
    JSON.stringify(verifyPublicRuntimeConfig(), null, 2) + "\n",
  );
}
