import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateSession: vi.fn(async (_request?: unknown, _headers?: Headers) => ({
    headers: new Headers(),
  })),
  next: vi.fn((_options?: { request?: { headers?: Headers } }) => ({
    headers: new Headers(),
  })),
}));

vi.mock("next/server", () => ({
  NextResponse: { next: mocks.next },
}));
vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: mocks.updateSession,
}));

import { config, proxy } from "./proxy";

const request = (pathname: string) => ({
  headers: new Headers({ "x-request-id": "synthetic" }),
  nextUrl: { pathname },
}) as Parameters<typeof proxy>[0];

describe("proxy liveness isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateSession.mockImplementation(async () => ({
      headers: new Headers(),
    }));
  });

  it("bypasses Supabase session checks only for exact /api/health", async () => {
    const response = await proxy(request("/api/health"));
    expect(mocks.updateSession).not.toHaveBeenCalled();
    expect(mocks.next).toHaveBeenCalledTimes(1);
    expect(response.headers.get("Content-Security-Policy")).toContain("script-src");
  });

  it("keeps nonce and CSP in forwarded and response headers for liveness", async () => {
    const response = await proxy(request("/api/health"));
    const forwarded = mocks.next.mock.calls[0]?.[0]?.request?.headers;
    expect(forwarded?.get("x-nonce")).toBeTruthy();
    expect(forwarded?.get("x-request-id")).toBe("synthetic");
    expect(forwarded?.get("Content-Security-Policy")).toBe(
      response.headers.get("Content-Security-Policy"),
    );
  });

  it("liveness does not wait for a stalled session refresh", async () => {
    mocks.updateSession.mockImplementation(
      () => new Promise<{ headers: Headers }>(() => {}),
    );
    await expect(proxy(request("/api/health"))).resolves.toBeDefined();
    expect(mocks.updateSession).not.toHaveBeenCalled();
  });

  it("continues checking session for readiness and protected routes", async () => {
    await proxy(request("/api/ready"));
    await proxy(request("/santuario"));
    expect(mocks.updateSession).toHaveBeenCalledTimes(2);
    expect(mocks.next).not.toHaveBeenCalled();
  });

  it("does not bypass authentication for similarly named routes", async () => {
    await proxy(request("/api/health/private"));
    await proxy(request("/api/healthy"));
    expect(mocks.updateSession).toHaveBeenCalledTimes(2);
  });

  it("does not swallow session failures on protected routes", async () => {
    mocks.updateSession.mockRejectedValue(new Error("auth unavailable"));
    await expect(proxy(request("/santuario"))).rejects.toThrow("auth unavailable");
    expect(mocks.next).not.toHaveBeenCalled();
  });

  it("keeps existing non-asset matcher coverage for health and protected paths", () => {
    const matcher = new RegExp(config.matcher[0]);
    expect(matcher.test("/api/health")).toBe(true);
    expect(matcher.test("/santuario")).toBe(true);
    expect(matcher.test("/_next/static/chunk.js")).toBe(false);
  });
});
