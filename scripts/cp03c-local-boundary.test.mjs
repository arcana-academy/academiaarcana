import { test } from "node:test";
import assert from "node:assert/strict";
import { requireLoopbackHttp, validateCp03cIsolation } from "./cp03c-local-boundary.mjs";

const safe = {
  CP03C_LOCAL_AUTH_ENABLED: "1",
  CP03C_FRONTEND_URL: "http://127.0.0.1:3000",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_fixture",
  E2E_EMAIL: "test@local.invalid",
  E2E_PASSWORD: "a".repeat(24),
  CP03C_EPHEMERAL_SUPABASE_ADMIN_KEY: "ephemeral-only",
};

test("accepts explicit local fixture with disposable credentials", () => {
  assert.equal(validateCp03cIsolation(safe, { requireUser: true, requireAdmin: true }).supabase, "http://127.0.0.1:54321");
});

for (const value of [
  "https://example.supabase.co",
  "http://127.0.0.1.evil.example:54321",
  "http://0.0.0.0:54321",
  "http://192.168.1.22:54321",
  "http://user:password@127.0.0.1:54321",
  "http://127.0.0.1:54321/path",
  "http://127.0.0.1:54321?next=https://example.org",
]) {
  test(`refuses unsafe target ${value}`, () => {
    assert.throws(() => requireLoopbackHttp(value, "test"), /CP03C BLOCKED/);
  });
}

test("refuses external credentials", () => {
  assert.throws(() => validateCp03cIsolation({ ...safe, SUPABASE_ACCESS_TOKEN: "unsafe" }), /CP03C BLOCKED/);
});
test("refuses missing opt-in", () => {
  assert.throws(() => validateCp03cIsolation({ ...safe, CP03C_LOCAL_AUTH_ENABLED: "0" }), /CP03C BLOCKED/);
});
test("refuses missing temporary local user", () => {
  assert.throws(() => validateCp03cIsolation({ ...safe, E2E_EMAIL: "real@example.com" }, { requireUser: true }), /CP03C BLOCKED/);
});
