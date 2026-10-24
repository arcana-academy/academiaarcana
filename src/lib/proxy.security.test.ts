import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateSession: vi.fn(),
}));

vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: mocks.updateSession,
}));

import { proxy } from "../proxy";

function createRequest(
  options: {
    method?: string;
    origin?: string;
    pathname?: string;
    host?: string;
    nextUrlOrigin?: string;
  } = {},
) {
  const headers = new Headers(
    options.origin ? { origin: options.origin } : undefined,
  );
  if (options.host) headers.set("host", options.host);
  const pathname = options.pathname ?? "/path";
  return {
    headers,
    method: options.method ?? "GET",
    nextUrl: new URL(pathname, options.nextUrlOrigin ?? "https://app.example"),
  } as never;
}

describe("proxy security headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks cross-origin unsafe methods before session processing", async () => {
    const response = await proxy(
      createRequest({
        method: "POST",
        origin: "https://attacker.example",
        host: "app.example",
      }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "cross_origin_request_blocked" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.updateSession).not.toHaveBeenCalled();
  });

  it("allows same-origin writes and read-only cross-origin requests", async () => {
    const response = { headers: new Headers() };
    mocks.updateSession.mockResolvedValue(response);

    await proxy(createRequest({ method: "POST", origin: "https://app.example" }));
    await proxy(createRequest({ method: "GET", origin: "https://attacker.example" }));

    expect(mocks.updateSession).toHaveBeenCalledTimes(2);
  });

  it("allows a same-Host mutation when a reverse proxy normalized Next URL", async () => {
    const response = { headers: new Headers() };
    mocks.updateSession.mockResolvedValue(response);

    await proxy(createRequest({
      method: "POST",
      origin: "https://app.example",
      host: "app.example",
      nextUrlOrigin: "https://next-internal.example",
    }));

    expect(mocks.updateSession).toHaveBeenCalledTimes(1);
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
