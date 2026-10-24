import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateSession: vi.fn(),
}));

vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: mocks.updateSession,
}));

import { proxy } from "../proxy";

function createRequest(pathname = "/santuario") {
  // Mirrors a real Next.js middleware request: `nextUrl` is always present.
  return { headers: new Headers(), nextUrl: { pathname } } as never;
}

describe("proxy security headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("passes a per-request nonce through request headers and response CSP", async () => {
    const response = { headers: new Headers() };
    mocks.updateSession.mockResolvedValue(response);

    await proxy(createRequest());

    expect(mocks.updateSession).toHaveBeenCalledTimes(1);

    const [, requestHeaders] = mocks.updateSession.mock.calls[0];
    const nonce = requestHeaders.get("x-nonce");
    const requestCsp = requestHeaders.get("Content-Security-Policy");
    const responseCsp = response.headers.get("Content-Security-Policy");

    expect(nonce).toEqual(expect.any(String));
    expect(nonce).not.toHaveLength(0);
    expect(requestCsp).toContain(`'nonce-${nonce}'`);
    expect(responseCsp).toBe(requestCsp);
    expect(requestCsp).not.toContain("'unsafe-eval'");
    expect(requestCsp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(requestCsp).toContain("style-src-attr 'unsafe-inline'");
    expect(requestCsp).toContain("upgrade-insecure-requests");
  });

  it("enforces the policy in production", async () => {
    const response = { headers: new Headers() };
    mocks.updateSession.mockResolvedValue(response);

    await proxy(createRequest());

    expect(response.headers.get("Content-Security-Policy-Report-Only")).toBeNull();
  });

  it("reports instead of enforcing in development so HMR keeps working", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = { headers: new Headers() };
    mocks.updateSession.mockResolvedValue(response);

    await proxy(createRequest());

    const reportOnly = response.headers.get("Content-Security-Policy-Report-Only");

    expect(reportOnly).toContain("script-src 'self' 'nonce-");
    expect(response.headers.get("Content-Security-Policy")).toBeNull();
  });
});
