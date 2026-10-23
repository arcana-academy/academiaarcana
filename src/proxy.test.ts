import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateSession: vi.fn(async (_request?: unknown, _headers?: Headers) => ({
    headers: new Headers(),
  })),
  next: vi.fn((_options?: { request?: { headers?: Headers } }) => ({
    headers: new Headers(),
  })),
  json: vi.fn((_body: unknown, options: { status: number; headers: HeadersInit }) => ({
    status: options.status,
    headers: new Headers(options.headers),
  })),
}));

vi.mock("next/server", () => ({
  NextResponse: { next: mocks.next, json: mocks.json },
}));
vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: mocks.updateSession,
}));

import { config, proxy } from "./proxy";

const password = "SyntheticOnlyPreviewPassphrase-2026-Long-90";
const authorization = `Basic ${Buffer.from(`arcana-preview:${password}`).toString("base64")}`;

const request = (pathname: string, auth?: string) => ({
  headers: new Headers({
    "x-request-id": "synthetic",
    ...(auth ? { authorization: auth } : {}),
  }),
  nextUrl: { pathname },
}) as Parameters<typeof proxy>[0];

describe("proxy liveness and isolated preview protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AA_PRIVATE_PREVIEW", "disabled");
    mocks.updateSession.mockImplementation(async () => ({
      headers: new Headers(),
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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

  it("covers static assets and public paths for private preview enforcement", () => {
    expect(config.matcher).toEqual(["/:path*"]);
  });

  it("denies unauthenticated navigation, API, image and script requests", async () => {
    vi.stubEnv("AA_PRIVATE_PREVIEW", "required");
    vi.stubEnv("AA_PRIVATE_PREVIEW_PASSWORD", password);
    for (const pathname of [
      "/",
      "/santuario",
      "/api/ready",
      "/api/health/private",
      "/_next/static/chunk.js",
      "/_next/image",
      "/assets/sanctuary/sigil.svg",
    ]) {
      const response = await proxy(request(pathname));
      expect(response.headers.get("WWW-Authenticate")).toContain("Basic realm");
      expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
    }
    expect(mocks.json).toHaveBeenCalledTimes(7);
    expect(mocks.updateSession).not.toHaveBeenCalled();
  });

  it("fails closed when the preview password is not configured", async () => {
    vi.stubEnv("AA_PRIVATE_PREVIEW", "required");
    vi.stubEnv("AA_PRIVATE_PREVIEW_PASSWORD", "");
    const response = await proxy(request("/santuario", authorization));
    expect(response.headers.get("WWW-Authenticate")).toContain("Basic realm");
    expect(mocks.updateSession).not.toHaveBeenCalled();
  });

  it("preserves health monitoring and removes Basic credentials before forwarding", async () => {
    vi.stubEnv("AA_PRIVATE_PREVIEW", "required");
    vi.stubEnv("AA_PRIVATE_PREVIEW_PASSWORD", password);

    await proxy(request("/api/health"));
    expect(mocks.next).toHaveBeenCalledTimes(1);

    const result = await proxy(request("/santuario", authorization));
    expect(mocks.updateSession).toHaveBeenCalledTimes(1);
    const forwarded = mocks.updateSession.mock.calls[0]?.[1];
    expect(forwarded?.has("authorization")).toBe(false);
    expect(result.headers.get("X-Robots-Tag")).toContain("noindex");
    expect(result.headers.get("Cache-Control")).toBe("no-store");
  });

  it("guards assets before skipping unnecessary Supabase refreshes", async () => {
    vi.stubEnv("AA_PRIVATE_PREVIEW", "required");
    vi.stubEnv("AA_PRIVATE_PREVIEW_PASSWORD", password);
    await proxy(request("/_next/static/chunk.js", authorization));
    expect(mocks.next).toHaveBeenCalledTimes(1);
    expect(mocks.updateSession).not.toHaveBeenCalled();
  });
});
