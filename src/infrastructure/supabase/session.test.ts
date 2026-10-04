import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getClaims: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("@/core/config", () => ({
  getPublicRuntimeConfig: () => ({
    supabaseUrl: "https://example.supabase.co",
    supabasePublishableKey: "sb_publishable_test",
  }),
}));

vi.mock("next/server", async () => {
  class MockHeaders {
    private readonly values = new Map<string, string>();

    set(name: string, value: string) {
      this.values.set(name, value);
    }

    get(name: string) {
      return this.values.get(name) ?? null;
    }
  }

  class MockCookies {
    calls: unknown[][] = [];

    getAll() {
      return [];
    }

    set(...args: unknown[]) {
      this.calls.push(args);
    }
  }

  class MockResponse {
    cookies = new MockCookies();
    headers = new MockHeaders();

    static next() {
      return new MockResponse();
    }
  }

  return {
    NextResponse: MockResponse,
  };
});

import { updateSupabaseSession } from "./session";

describe("updateSupabaseSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.createServerClient.mockReturnValue({
      auth: {
        getClaims: mocks.getClaims,
      },
    });

    mocks.getClaims.mockResolvedValue({
      data: { claims: null },
      error: null,
    });
  });

  it("initializes a server client and validates claims", async () => {
    const request = {
      cookies: {
        getAll: () => [],
      },
    } as never;

    await updateSupabaseSession(request);

    expect(mocks.createServerClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "sb_publishable_test",
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      }),
    );
    expect(mocks.getClaims).toHaveBeenCalledTimes(1);
  });

  it("propagates request cookies, response cookie options, and cache headers during refresh", async () => {
    let setAll:
      | ((cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>,
          headers: Record<string, string>) => void)
      | undefined;

    mocks.createServerClient.mockImplementation((_url, _key, options) => {
      setAll = options.cookies.setAll;
      return {
        auth: {
          getClaims: async () => {
            setAll?.(
              [
                {
                  name: "sb-test-auth-token",
                  value: "refreshed",
                  options: {
                    httpOnly: false,
                    secure: true,
                    sameSite: "lax",
                  },
                },
              ],
              {
                "Cache-Control": "private, no-store",
              },
            );

            return {
              data: { claims: { sub: "user-123" } },
              error: null,
            };
          },
        },
      };
    });

    const requestCookies: Array<Record<string, unknown>> = [];
    const request = {
      cookies: {
        getAll: () => requestCookies,
        set: (...args: unknown[]) => {
          requestCookies.push({ args });
        },
      },
    } as never;

    const response = await updateSupabaseSession(request);

    expect(requestCookies).toHaveLength(1);
    expect(requestCookies[0]?.args).toEqual([
      "sb-test-auth-token",
      "refreshed",
    ]);
    expect(
      (response.cookies as unknown as { calls: unknown[][] }).calls,
    ).toEqual([
      [
        "sb-test-auth-token",
        "refreshed",
        {
          httpOnly: false,
          secure: true,
          sameSite: "lax",
        },
      ],
    ]);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
