import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const beforeNotify = vi.fn();
  const serverConfigure = vi.fn(() => ({ beforeNotify }));

  return {
    beforeNotify,
    browserConfigure: vi.fn(),
    browserDebug: vi.fn(),
    serverConfigure,
    serverDebug: vi.fn(),
    setupHoneybadger: vi.fn((config) => ({ ...config, honeybadger: true })),
  };
});

vi.mock("@honeybadger-io/react", () => ({
  Honeybadger: {
    configure: mocks.browserConfigure,
    logger: { debug: mocks.browserDebug },
  },
}));

vi.mock("@honeybadger-io/js", () => ({
  default: {
    configure: mocks.serverConfigure,
    logger: { debug: mocks.serverDebug },
  },
}));

vi.mock("@honeybadger-io/nextjs", () => ({
  setupHoneybadger: mocks.setupHoneybadger,
}));

describe("Honeybadger runtime configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.serverConfigure.mockReturnValue({
      beforeNotify: mocks.beforeNotify,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("configures the browser with public deployment metadata", async () => {
    vi.stubEnv("NEXT_PUBLIC_HONEYBADGER_API_KEY", "browser-key");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_HONEYBADGER_REVISION", "browser-revision");

    // @ts-expect-error The runtime config is intentionally authored as JavaScript.
    const { config } = await import("./honeybadger.browser.config.js");

    expect(config).toEqual({
      apiKey: "browser-key",
      environment: "preview",
      revision: "browser-revision",
      projectRoot: "webpack://_N_E/./",
    });
    expect(mocks.browserConfigure).toHaveBeenCalledWith(config);
    expect(mocks.browserDebug).toHaveBeenCalledWith(
      "Honeybadger configured for browser",
    );
  });

  it("falls back to server deployment metadata in the edge runtime", async () => {
    vi.stubEnv("NEXT_PUBLIC_HONEYBADGER_API_KEY", "edge-key");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "");
    vi.stubEnv("VERCEL_ENV", "staging");
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_HONEYBADGER_REVISION", "edge-revision");

    // @ts-expect-error The runtime config is intentionally authored as JavaScript.
    const { config } = await import("./honeybadger.edge.config.js");

    expect(config.environment).toBe("staging");
    expect(mocks.serverConfigure).toHaveBeenCalledWith(config);
    expect(mocks.serverDebug).toHaveBeenCalledWith(
      "Honeybadger configured for edge",
    );
  });

  it("falls back to NODE_ENV when deployment metadata is unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NODE_ENV", "test");

    // @ts-expect-error The runtime config is intentionally authored as JavaScript.
    const { config } = await import("./honeybadger.server.config.js");

    expect(config.environment).toBe("test");
    expect(mocks.serverConfigure).toHaveBeenCalledWith(config);
    expect(mocks.beforeNotify).toHaveBeenCalledOnce();
  });

  it("rewrites server build frames to their uploaded asset locations", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_HONEYBADGER_ASSETS_URL",
      "https://assets.example.com/_next",
    );
    // @ts-expect-error The runtime config is intentionally authored as JavaScript.
    await import("./honeybadger.server.config.js");
    const transform = mocks.beforeNotify.mock.calls[0][0];
    const notice = {
      backtrace: [
        { file: `${process.cwd()}/.next/server/app/page.js` },
        { file: "node:internal/process/task_queues" },
        {},
      ],
    };

    transform(notice);

    expect(notice.backtrace).toEqual([
      { file: "https://assets.example.com/_next/../app/page.js" },
      { file: "node:internal/process/task_queues" },
      {},
    ]);
  });

  it("leaves notices untouched when an asset URL is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_HONEYBADGER_ASSETS_URL", "");
    // @ts-expect-error The runtime config is intentionally authored as JavaScript.
    await import("./honeybadger.server.config.js");
    const transform = mocks.beforeNotify.mock.calls[0][0];
    const notice = {
      backtrace: [{ file: `${process.cwd()}/.next/server/app/page.js` }],
    };

    transform(notice);
    transform();

    expect(notice.backtrace[0].file).toBe(
      `${process.cwd()}/.next/server/app/page.js`,
    );
  });

  it("wraps strict-mode Next.js configuration exactly once", async () => {
    const { default: nextConfig } = await import("./next.config");

    expect(mocks.setupHoneybadger).toHaveBeenCalledOnce();
    expect(mocks.setupHoneybadger).toHaveBeenCalledWith({
      reactStrictMode: true,
    });
    expect(nextConfig).toEqual({
      reactStrictMode: true,
      honeybadger: true,
    });
  });
});
