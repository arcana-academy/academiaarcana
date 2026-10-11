/**
 * CP-03C: fail-closed authorization boundary for disposable, local-only browser tests.
 * No remote origins, project credentials, production data or external endpoints.
 * This validator is not a substitute for a local Supabase stack.
 */
const BLOCKED_CREDENTIALS = [
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_PROJECT_REF",
  "RENDER_API_KEY",
  "DATABASE_URL",
];

export function requireLoopbackHttp(value, label) {
  if (!value) throw new Error(`CP03C BLOCKED: missing ${label}`);
  let url;
  try { url = new URL(value); }
  catch { throw new Error(`CP03C BLOCKED: invalid ${label}`); }
  if (
    url.protocol !== "http:" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !url.port ||
    url.username || url.password || url.pathname !== "/" || url.search || url.hash
  ) {
    throw new Error(`CP03C BLOCKED: ${label} must be a loopback HTTP origin with explicit port`);
  }
  return url.origin;
}

export function validateCp03cIsolation(env, { requireUser = false, requireAdmin = false } = {}) {
  if (env.CP03C_LOCAL_AUTH_ENABLED !== "1") {
    throw new Error("CP03C BLOCKED: explicit local-only opt-in missing");
  }
  for (const name of BLOCKED_CREDENTIALS) {
    if (env[name]) throw new Error(`CP03C BLOCKED: unexpected external credential ${name}`);
  }
  const frontend = requireLoopbackHttp(env.CP03C_FRONTEND_URL, "CP03C_FRONTEND_URL");
  const supabase = requireLoopbackHttp(env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  if (frontend !== "http://127.0.0.1:3000") {
    throw new Error("CP03C BLOCKED: frontend must be http://127.0.0.1:3000");
  }
  if (supabase === frontend) throw new Error("CP03C BLOCKED: Supabase and frontend origins must differ");
  if (!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_")) {
    throw new Error("CP03C BLOCKED: local publishable key missing");
  }
  if (requireAdmin && !env.CP03C_EPHEMERAL_SUPABASE_ADMIN_KEY) {
    throw new Error("CP03C BLOCKED: local ephemeral Supabase admin key missing");
  }
  if (requireUser && (!env.E2E_EMAIL?.endsWith("@local.invalid") || !env.E2E_PASSWORD || env.E2E_PASSWORD.length < 20)) {
    throw new Error("CP03C BLOCKED: disposable local.invalid user missing");
  }
  return { frontend, supabase };
}

// Before any browser navigation or user creation, probe the local GoTrue service.
export async function verifyLocalAuthReady(env) {
  const { supabase } = validateCp03cIsolation(env);
  const response = await fetch(`${supabase}/auth/v1/health`, {
    redirect: "error",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`CP03C BLOCKED: local Auth health returned HTTP ${response.status}`);
  return true;
}

if (process.argv[1]?.endsWith("/cp03c-local-boundary.mjs")) {
  await verifyLocalAuthReady(process.env);
  console.log("CP03C OK: frontend and Supabase are loopback-only; local Auth healthy");
}
