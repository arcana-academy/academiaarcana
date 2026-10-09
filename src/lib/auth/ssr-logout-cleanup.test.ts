import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  set: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: mocks.getAll,
    set: mocks.set,
  }),
}));

vi.mock("@/core/config", () => ({
  getPublicRuntimeConfig: () => ({
    supabaseUrl: "https://example.supabase.co",
    supabasePublishableKey: "sb_publishable_synthetic",
  }),
}));

import { clearLocalAuthSession } from "./ssr-logout-cleanup";

describe("strict logout-only SSR cookie removal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expires every known auth cookie and does not expire unrelated cookies", async () => {
    mocks.getAll.mockReturnValue([
      { name: "sb-example-auth-token.0", value: "part-0" },
      { name: "sb-example-auth-token.1", value: "part-1" },
      { name: "unrelated", value: "keep" },
    ]);
    await expect(clearLocalAuthSession()).resolves.toBeUndefined();
    expect(mocks.set).toHaveBeenCalledTimes(2);
    const names = mocks.set.mock.calls.map(([name]) => name);
    expect(names.sort()).toEqual([
      "sb-example-auth-token.0",
      "sb-example-auth-token.1",
    ]);
    for (const [, , options] of mocks.set.mock.calls) {
      expect(options).toMatchObject({ path: "/", maxAge: 0 });
    }
  });

  it("expires an unchunked auth cookie", async () => {
    mocks.getAll.mockReturnValue([
      { name: "sb-example-auth-token", value: "auth" },
    ]);
    await clearLocalAuthSession();
    expect(mocks.set).toHaveBeenCalledTimes(1);
    expect(mocks.set.mock.calls[0][0]).toBe("sb-example-auth-token");
  });

  it("does not touch cookies if auth cookies are absent", async () => {
    mocks.getAll.mockReturnValue([{ name: "other", value: "keep" }]);
    await clearLocalAuthSession();
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("propagates a thrown cookie write failure", async () => {
    mocks.getAll.mockReturnValue([
      { name: "sb-example-auth-token", value: "auth" },
    ]);
    mocks.set.mockImplementationOnce(() => {
      throw new Error("write blocked");
    });
    await expect(clearLocalAuthSession()).rejects.toThrow("write blocked");
  });

  it("reports partial writes instead of silently succeeding", async () => {
    mocks.getAll.mockReturnValue([
      { name: "sb-example-auth-token.0", value: "a" },
      { name: "sb-example-auth-token.1", value: "b" },
    ]);
    mocks.set.mockImplementationOnce(() => {}).mockImplementationOnce(() => {
      throw new Error("second chunk blocked");
    });
    await expect(clearLocalAuthSession()).rejects.toThrow("second chunk blocked");
    expect(mocks.set).toHaveBeenCalledTimes(2);
  });
});
