import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SHA40 = /^[0-9a-f]{40}$/;
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]']);
const FORBIDDEN_RUNTIME_NAMES = [
  'OPENAI_API_KEY', 'PARALLEL_API_KEY', 'EXA_API_KEY',
  'RENDER_API_KEY', 'RENDER_DEPLOY_HOOK_URL', 'DATABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_DB_PASSWORD',
];

function localApiUrl(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' || !LOOPBACK.has(url.hostname)) return null;
    if (url.username || url.password || url.search || url.hash) return null;
    if (url.pathname !== '/' || !url.port) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Pure, redaction-safe technical preflight. Does NOT approve C03, attest host
 * disposal/network isolation or establish an independent human review.
 * `localSupabaseApi` must come from `supabase status -o env` in this executor.
 */
export function assessSyntheticIsolation({ env, currentHead, localSupabaseApi, localSupabaseAnonKey }) {
  const reasons = [];
  if (env.C03_QA_MODE !== 'synthetic-local') {
    reasons.push('C03_QA_MODE must be synthetic-local');
  }
  if (!SHA40.test(env.C03_QA_EXPECTED_SHA ?? '') ||
      env.C03_QA_EXPECTED_SHA !== currentHead) {
    reasons.push('expected HEAD is missing, malformed or different from checkout');
  }
  const local = localApiUrl(localSupabaseApi);
  const runtime = localApiUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  if (!local) reasons.push('Supabase CLI did not report a valid loopback HTTP API');
  if (!runtime) reasons.push('public Supabase URL is not loopback HTTP');
  if (local && runtime && local.origin !== runtime.origin) {
    reasons.push('application API origin differs from disposable Supabase API');
  }
  // The runtime URL can be local while its key belongs to a different project.
  // Compare public anonymous keys supplied by the same local CLI status call;
  // never print, persist, or return either key in a reason.
  if (typeof localSupabaseAnonKey !== 'string' || !localSupabaseAnonKey.trim()) {
    reasons.push('Supabase CLI did not report a local ANON_KEY');
  }
  if (typeof env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== 'string' ||
      !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.trim() ||
      !localSupabaseAnonKey ||
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== localSupabaseAnonKey) {
    reasons.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must match local Supabase CLI ANON_KEY');
  }
  if (!/^[a-z0-9._+\-]+@[a-z0-9.\-]+\.test$/i.test(env.E2E_EMAIL ?? '')) {
    reasons.push('E2E_EMAIL must use a reserved .test domain');
  }
  if (!env.E2E_PASSWORD || env.E2E_PASSWORD.length < 12) {
    reasons.push('synthetic E2E_PASSWORD must be set and at least 12 characters');
  }
  for (const name of FORBIDDEN_RUNTIME_NAMES) {
    if (env[name]) reasons.push(`forbidden production-capable variable present: ${name}`);
  }
  return { ok: reasons.length === 0, reasons };
}

function supabaseStatusField(envOutput, field) {
  const line = envOutput.split(/\r?\n/).find((item) => item.startsWith(`${field}=`));
  return line?.slice(field.length + 1).trim().replace(/^['"]|['"]$/g, '') ?? '';
}

export function assessCliInputs({ env, readGitHead, readSupabaseStatus }) {
  let currentHead = '';
  let localSupabaseApi = '';
  let localSupabaseAnonKey = '';
  try { currentHead = readGitHead().trim(); } catch { /* fail closed below */ }
  try {
    const status = readSupabaseStatus();
    localSupabaseApi = supabaseStatusField(status, 'API_URL');
    localSupabaseAnonKey = supabaseStatusField(status, 'ANON_KEY');
  } catch { /* fail closed below */ }
  return assessSyntheticIsolation({ env, currentHead, localSupabaseApi, localSupabaseAnonKey });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = assessCliInputs({
    env: process.env,
    readGitHead: () => execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }),
    readSupabaseStatus: () => execFileSync('supabase', ['status', '-o', 'env'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }),
  });
  if (!result.ok) {
    console.error('BLOCKED: synthetic QA technical preflight failed:');
    for (const reason of result.reasons) console.error(`- ${reason}`);
    process.exitCode = 2;
  } else {
    console.log('PASS: checkout SHA and loopback Supabase technical checks.');
    console.log('NOT VERIFIED: independent human authorization, isolation of the host/network, disposal evidence and protected C03 approval.');
  }
}
