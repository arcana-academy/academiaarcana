import { describe, expect, it, vi } from "vitest";

const { setupHoneybadger, wrappedConfig } = vi.hoisted(() => ({
  setupHoneybadger: vi.fn(),
  wrappedConfig: { honeybadger: true, reactStrictMode: true },
}));

vi.mock("@honeybadger-io/nextjs", () => ({
  setupHoneybadger: setupHoneybadger.mockReturnValue(wrappedConfig),
}));

describe("Next.js configuration", () => {
  it("wraps strict-mode configuration with Honeybadger", async () => {
    const { default: nextConfig } = await import("./next.config");

    expect(setupHoneybadger).toHaveBeenCalledOnce();
    expect(setupHoneybadger).toHaveBeenCalledWith({ reactStrictMode: true });
    expect(nextConfig).toBe(wrappedConfig);
  });
});
