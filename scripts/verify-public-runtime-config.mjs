import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";

const BUILD_ENV_FILES = [
  ".env.production.local",
  ".env.local",
  ".env.production",
  ".env",
];

export function loadBuildEnvironment(
  baseEnvironment = process.env,
  cwd = process.cwd(),
) {
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

function validatePublishableKey(publishableKey) {
  if (!/^sb_publishable_[A-Za-z0-9_-]{22}_[A-Za-z0-9_-]{8}$/.test(publishableKey)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must use the expected sb_publishable_<22-char-random>_<8-char-checksum> format.",
    );
  }
}

export function validateSupabaseProductionConfiguration(
  supabaseUrl,
  publishableKey,
) {
  let parsedUrl;

  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS Supabase project URL.",
    );
  }

  const projectRef = parsedUrl.hostname.replace(/\.supabase\.co$/, "");

  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.port ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search ||
    parsedUrl.hash ||
    !/^[a-z0-9]{20}$/.test(projectRef)
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS Supabase project URL.",
    );
  }

  validatePublishableKey(publishableKey);
}

export function validateLocalE2EConfiguration(
  supabaseUrl,
  publishableKey,
  environment,
) {
  if (
    environment.CI !== "true" ||
    environment.E2E_LOCAL_RUNTIME !== "1"
  ) {
    throw new Error(
      "Local Supabase runtime is allowed only for explicit CI E2E execution.",
    );
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error("Local Supabase E2E URL must be a valid localhost URL.");
  }

  if (
    parsedUrl.protocol !== "http:" ||
    !["127.0.0.1", "localhost"].includes(parsedUrl.hostname) ||
    !parsedUrl.port ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error("Local Supabase E2E URL must be a valid localhost URL.");
  }

  validatePublishableKey(publishableKey);
}

export function verifyPublicRuntimeConfig(environment = loadBuildEnvironment()) {
  for (const name of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ]) {
    if (!environment[name]?.trim()) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }

  const isExplicitLocalE2E =
    environment.CI === "true" && environment.E2E_LOCAL_RUNTIME === "1";

  if (isExplicitLocalE2E) {
    validateLocalE2EConfiguration(
      environment.NEXT_PUBLIC_SUPABASE_URL,
      environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      environment,
    );
  } else {
    validateSupabaseProductionConfiguration(
      environment.NEXT_PUBLIC_SUPABASE_URL,
      environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  }

  return {
    integration: "supabase-public-runtime",
    verified: true,
    environment: environment.APP_ENV ?? environment.NODE_ENV ?? "unknown",
    configuration: isExplicitLocalE2E ? "local-e2e-environment" : "environment",
  };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  console.log(JSON.stringify(verifyPublicRuntimeConfig(), null, 2));
}
