import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";

const PREVIEW_SUPABASE_URL = "https://fichnalpbcfjywwhixid.supabase.co";
const PREVIEW_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_0yFN7N7ikHBDY6m6P3FICw_u1lL6ppI";

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

    if (!existsSync(path)) {
      continue;
    }

    const parsed = parseEnv(readFileSync(path, "utf8"));

    for (const [name, value] of Object.entries(parsed)) {
      if (!(name in environment)) {
        environment[name] = value;
      }
    }
  }

  return environment;
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

  if (!/^sb_publishable_[A-Za-z0-9]{22}_[A-Za-z0-9]{8}$/.test(publishableKey)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must use the expected sb_publishable_<22-char-random>_<8-char-checksum> format.",
    );
  }
}

export function verifyPublicRuntimeConfig(environment = loadBuildEnvironment()) {
  const isPreview = environment.VERCEL_ENV === "preview";
  const supabaseUrl =
    environment.NEXT_PUBLIC_SUPABASE_URL ||
    (isPreview ? PREVIEW_SUPABASE_URL : undefined);
  const publishableKey =\n    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||\n    (isPreview ? PREVIEW_SUPABASE_PUBLISHABLE_KEY : undefined);

  if (!supabaseUrl) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!publishableKey) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  if (environment.VERCEL_ENV === "production") {
    validateSupabaseProductionConfiguration(supabaseUrl, publishableKey);
  }

  return {
    integration: "supabase-public-runtime",
    verified: true,
    environment: environment.VERCEL_ENV ?? environment.NODE_ENV ?? "unknown",
  };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  console.log(JSON.stringify(verifyPublicRuntimeConfig(), null, 2));
}
