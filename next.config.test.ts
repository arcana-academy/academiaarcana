import { describe, expect, it, vi } from "vitest";

const { withHoneybadgerConfig, wrappedConfig } = vi.hoisted(() => ({
  withHoneybadgerConfig: vi.fn(),
  wrappedConfig: {
    honeybadger: true,
    reactStrictMode: true,
    poweredByHeader: false,
  },
}));

vi.mock("@honeybadger-io/nextjs", () => ({
  withHoneybadgerConfig: withHoneybadgerConfig.mockReturnValue(wrappedConfig),
}));

describe("Next.js configuration", () => {
  it("wraps strict-mode configuration with Honeybadger and security headers", async () => {
    const { default: nextConfig } = await import("./next.config");

    expect(withHoneybadgerConfig).toHaveBeenCalledOnce();
    expect(withHoneybadgerConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        reactStrictMode: true,
        poweredByHeader: false,
        headers: expect.any(Function),
      }),
      { disableSourceMapUpload: true },
    );
    expect(nextConfig).toBe(wrappedConfig);
  });
});
