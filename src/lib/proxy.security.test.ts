import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateSession: vi.fn(),
}));

vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: mocks.updateSession,
}));

import { proxy } from "../proxy";

describe("proxy security headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes a per-request nonce through request headers and response CSP", async () => {
    const request = {
      headers: new Headers(),
    } as never;

    const response = {
      headers: new Headers(),
    };

    mocks.updateSession.mockResolvedValue(response);

    await proxy(request);

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
  });
});
