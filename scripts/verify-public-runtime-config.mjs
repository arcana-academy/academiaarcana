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
  const isVercel = ["preview", "production"].includes(environment.VERCEL_ENV);
  const hasConfiguredPublicValues =
    Boolean(environment.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!isVercel && !environment.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!isVercel && !environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  if (hasConfiguredPublicValues && environment.VERCEL_ENV === "production") {
    validateSupabaseProductionConfiguration(
      environment.NEXT_PUBLIC_SUPABASE_URL,
      environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  }

  return {
    integration: "supabase-public-runtime",
    verified: true,
    environment: environment.VERCEL_ENV ?? environment.NODE_ENV ?? "unknown",
    configuration: hasConfiguredPublicValues ? "environment" : "safe-vercel-fallback",
  };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  console.log(JSON.stringify(verifyPublicRuntimeConfig(), null, 2));
}
