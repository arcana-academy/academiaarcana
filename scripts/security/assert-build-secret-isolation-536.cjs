"use strict";

// P0 #536: fail closed BEFORE dependency install or Next.js compilation.
// This detects exposed credential-bearing environment variables by NAME only.
// It must not log, hash, or otherwise inspect credential values beyond nonemptiness.
const PUBLIC_BROWSER_KEYS = new Set([
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_HONEYBADGER_API_KEY",
]);

const RUNTIME_CREDENTIAL_NAME =
  /(?:^|_)(?:API_KEY|ACCESS_TOKEN|REFRESH_TOKEN|CLIENT_SECRET|SECRET_KEY|PRIVATE_KEY|SIGNING_KEY|SERVICE_ROLE_KEY|DATABASE_URL|DATABASE_PASSWORD|DB_URL|DB_PASSWORD|PASSWORD|TOKEN|SECRET|CREDENTIALS?|DEPLOY_HOOK_URL)(?:$|_)/i;

function isSensitiveName(name) {
  return typeof name === "string" &&
    !PUBLIC_BROWSER_KEYS.has(name) &&
    RUNTIME_CREDENTIAL_NAME.test(name);
}

function exposedNames(env) {
  return Object.keys(env).filter((name) =>
    isSensitiveName(name) && typeof env[name] === "string" && env[name].length > 0,
  );
}

function verify(env) {
  const exposed = exposedNames(env);
  if (exposed.length > 0) {
    // Do not print env keys or values. A generic refusal is sufficient.
    throw new Error("P0 #536: build-time environment contains runtime credential variables; refusing build.");
  }
  return true;
}

module.exports = { isSensitiveName, exposedNames, verify };

if (require.main === module) {
  try {
    verify(process.env);
    process.stdout.write("P0 #536 build credential preflight: PASS (no credential-bearing variables).\n");
  } catch {
    process.stderr.write("P0 #536 build credential preflight: FAIL CLOSED; no build attempted.\n");
    process.exitCode = 1;
  }
}
