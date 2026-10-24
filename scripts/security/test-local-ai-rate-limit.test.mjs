// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  execFileSync: vi.fn(),
  createClient: vi.fn(),
  signUp: vi.fn(),
  rpc: vi.fn(),
  counts: new Map(),
}));
vi.mock("node:child_process", () => ({ execFileSync: mocks.execFileSync }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));

const run = () => import("./test-local-ai-rate-limit.mjs");
const statusOutput = (url = "http://127.0.0.1:54321", key = "synthetic-anon-key") =>
  `API_URL="${url}"\nANON_KEY='${key}'\n`;

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  mocks.counts.clear();
  vi.stubEnv("AA_LOCAL_SUPABASE_E2E", "1");
  vi.spyOn(console, "log").mockImplementation(() => {});
  mocks.execFileSync.mockReturnValue(statusOutput());
  mocks.signUp.mockImplementation(async ({ email }) => ({
    data: { user: { id: email }, session: { access_token: "synthetic-local-token" } },
    error: null,
  }));
  mocks.rpc.mockImplementation(async function () {
    const count = (mocks.counts.get(this) ?? 0) + 1;
    mocks.counts.set(this, count);
    const allowed = count <= 20;
    return {
      data: [{
        allowed,
        rate_limit: 20,
        remaining: Math.max(0, 20 - count),
        retry_after_seconds: 60,
      }],
      error: null,
    };
  });
  mocks.createClient.mockImplementation(() => ({ auth: { signUp: mocks.signUp }, rpc: mocks.rpc }));
});

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("isolated local durable AI rate-limit runner", () => {
  it("requires the explicit local opt-in before contacting Supabase CLI", async () => {
    vi.stubEnv("AA_LOCAL_SUPABASE_E2E", "0");
    await expect(run()).rejects.toThrow();
    expect(mocks.execFileSync).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each([
    "https://127.0.0.1:54321", "http://example.test:54321",
    "http://127.0.0.1.example.test:54321", "http://0.0.0.0:54321",
    "http://127.0.0.1:54321/rest/v1", "http://127.0.0.1:54321/?query=1",
    "http://127.0.0.1:54321/#fragment", "http://user@127.0.0.1:54321",
    "not-a-url",
  ])("refuses non-local Supabase status URL %s before creating accounts", async (url) => {
    mocks.execFileSync.mockReturnValueOnce(statusOutput(url));
    await expect(run()).rejects.toThrow();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("uses only local synthetic accounts and verifies a concurrent per-user quota", async () => {
    await run();
    expect(mocks.execFileSync).toHaveBeenCalledWith("supabase", ["status", "-o", "env"], {
      encoding: "utf8",
      timeout: 30_000,
    });
    expect(mocks.createClient).toHaveBeenCalledTimes(2);
    expect(mocks.createClient).toHaveBeenCalledWith("http://127.0.0.1:54321/", "synthetic-anon-key", {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    expect(mocks.signUp).toHaveBeenCalledTimes(2);
    expect(mocks.rpc).toHaveBeenCalledTimes(25);
    expect(mocks.rpc).toHaveBeenCalledWith("consume_open_source_ai_rate_limit");
    expect(mocks.signUp.mock.calls[0][0].email).toMatch(/^ai-rate-a-[\da-f-]+@example\.test$/);
    expect(mocks.signUp.mock.calls[1][0].email).toMatch(/^ai-rate-b-[\da-f-]+@example\.test$/);
    expect(mocks.signUp.mock.calls[0][0].password).not.toBe(mocks.signUp.mock.calls[1][0].password);
  });

  it("stops when the local Auth signup has no session", async () => {
    mocks.signUp.mockResolvedValueOnce({ data: { user: { id: "synthetic" }, session: null }, error: null });
    await expect(run()).rejects.toThrow();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("fails visibly if the durable RPC does not return a complete row", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(run()).rejects.toThrow();
  });
});
