import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessSyntheticIsolation, assessCliInputs } from './c03-synthetic-isolation.mjs';

const SHA = '2440fc857cd0c8b141a08db5693e75537ba62428';
const baseline = () => ({
  env: {
    C03_QA_MODE: 'synthetic-local', C03_QA_EXPECTED_SHA: SHA,
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    E2E_EMAIL: 'learner-qa@example.test',
    E2E_PASSWORD: 'Synthetic-Sandbox-Only-2026!',
  },
  currentHead: SHA,
  localSupabaseApi: 'http://127.0.0.1:54321',
});

function blockedWith(edit, fragment) {
  const data = baseline();
  edit(data);
  const result = assessSyntheticIsolation(data);
  assert.equal(result.ok, false);
  assert.ok(result.reasons.some(reason => reason.includes(fragment)), result.reasons.join('; '));
}

test('accepts a same-SHA localhost-only synthetic technical configuration', () => {
  assert.deepEqual(assessSyntheticIsolation(baseline()), { ok: true, reasons: [] });
});
test('rejects missing explicit synthetic mode', () => {
  blockedWith(x => { delete x.env.C03_QA_MODE; }, 'C03_QA_MODE');
});
test('rejects stale or spoofed HEAD', () => {
  blockedWith(x => { x.currentHead = 'a'.repeat(40); }, 'expected HEAD');
});
test('rejects malformed expected HEAD', () => {
  blockedWith(x => { x.env.C03_QA_EXPECTED_SHA = 'main'; }, 'expected HEAD');
});
test('rejects hosted Supabase URLs', () => {
  blockedWith(x => { x.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'; }, 'public Supabase');
});
test('rejects lookalike localhost domains', () => {
  blockedWith(x => { x.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost.attacker.test:54321'; }, 'public Supabase');
});
test('rejects differing local Supabase origins', () => {
  blockedWith(x => { x.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54322'; }, 'differs');
});
test('rejects credential-bearing URLs', () => {
  blockedWith(x => { x.env.NEXT_PUBLIC_SUPABASE_URL = 'http://user:password@127.0.0.1:54321'; }, 'public Supabase');
});
test('rejects non-synthetic account email domains', () => {
  blockedWith(x => { x.env.E2E_EMAIL = 'actual@company.com'; }, 'E2E_EMAIL');
});
test('rejects missing synthetic password', () => {
  blockedWith(x => { delete x.env.E2E_PASSWORD; }, 'E2E_PASSWORD');
});
test('rejects presence of runtime secrets by name without printing values', () => {
  blockedWith(x => { x.env.OPENAI_API_KEY = 'must-not-be-printed'; }, 'OPENAI_API_KEY');
  assert.ok(!assessSyntheticIsolation({...baseline(),env:{...baseline().env,OPENAI_API_KEY:'must-not-be-printed'}}).reasons.join(' ').includes('must-not-be-printed'));
});
test('rejects absent Supabase CLI status', () => {
  blockedWith(x => { x.localSupabaseApi = ''; }, 'Supabase CLI');
});
test('CLI evaluator parses quoted local status without contacting networks', () => {
  const result = assessCliInputs({
    env: baseline().env, readGitHead: () => `${SHA}\n`,
    readSupabaseStatus: () => 'API_URL="http://127.0.0.1:54321"\nOTHER_KEY=redacted\n',
  });
  assert.equal(result.ok, true);
});
test('CLI evaluator fails closed on missing binary', () => {
  const result = assessCliInputs({env: baseline().env,readGitHead: () => SHA,readSupabaseStatus: () => {throw Error('missing binary');}});
  assert.equal(result.ok, false);
});
