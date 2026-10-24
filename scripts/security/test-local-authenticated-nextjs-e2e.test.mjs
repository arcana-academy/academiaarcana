// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  execFileSync: vi.fn(), spawn: vi.fn(), spawnSync: vi.fn(),
  mkdtempSync: vi.fn(), rmSync: vi.fn(), connect: vi.fn(),
  createClient: vi.fn(), signUp: vi.fn(), from: vi.fn(), insert: vi.fn(),
  select: vi.fn(), single: vi.fn(), kill: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execFileSync: mocks.execFileSync, spawn: mocks.spawn, spawnSync: mocks.spawnSync,
}));
vi.mock("node:fs", () => ({ mkdtempSync: mocks.mkdtempSync, rmSync: mocks.rmSync }));
vi.mock("node:net", () => ({ connect: mocks.connect }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));

const loadRunner = () => import("./test-local-authenticated-nextjs-e2e.mjs");
const status = (url = "http://127.0.0.1:54321", key = "synthetic-anon-key") =>
  `API_URL="${url}"\r\nANON_KEY='${key}'\r\nignored status line\r\n`;

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv("GITHUB_ACTIONS", "true");
  vi.stubEnv("GITHUB_EVENT_NAME", "pull_request");
  vi.stubEnv("AA_LOCAL_SUPABASE_E2E", "1");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_URL", "");
  vi.spyOn(console, "log").mockImplementation(() => {});
  mocks.execFileSync.mockReturnValue(status());
  mocks.createClient.mockReturnValue({ auth: { signUp: mocks.signUp }, from: mocks.from });
  mocks.signUp.mockResolvedValue({
    data: { user: { id: "synthetic-owner" }, session: { access_token: "synthetic-session" } }, error: null,
  });
  mocks.from.mockReturnValue({ insert: mocks.insert });
  mocks.insert.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ single: mocks.single });
  mocks.single.mockResolvedValue({ data: { id: "synthetic-grimoire" }, error: null });
  mocks.mkdtempSync.mockReturnValue("/synthetic/c26-tls");
  mocks.spawn.mockReturnValue({ exitCode: null, kill: mocks.kill });
  mocks.spawnSync.mockReturnValue({ status: 0, signal: null });
  mocks.connect.mockImplementation(() => {
    const socket = { destroy: vi.fn(), once: vi.fn() };
    socket.once.mockImplementation((event, callback) => {
      if (event === "connect") queueMicrotask(callback);
      return socket;
    });
    return socket;
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("local authenticated Next.js runner", () => {
  it.each([
    ["GITHUB_ACTIONS", "false"], ["GITHUB_EVENT_NAME", "push"],
    ["GITHUB_EVENT_NAME", "pull_request_target"], ["AA_LOCAL_SUPABASE_E2E", "0"],
  ])("rejects %s=%s before reading local configuration", async (name, value) => {
    vi.stubEnv(name, value);
    await expect(loadRunner()).rejects.toThrow();
    expect(mocks.execFileSync).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each([
    "https://127.0.0.1:54321", "http://hosted.example.test", "http://localhost.example.test",
    "http://127.0.0.1:54321/auth", "http://127.0.0.1:54321/?query=1",
    "http://127.0.0.1:54321/#fragment", "http://user:password@127.0.0.1:54321",
  ])("rejects unsafe Supabase endpoint %s before creating an identity", async (url) => {
    mocks.execFileSync.mockReturnValue(status(url));
    await expect(loadRunner()).rejects.toThrow();
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.spawn).not.toHaveBeenCalled();
  });

  it.each(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"])(
    "refuses to replace a conflicting %s origin", async (name) => {
      vi.stubEnv(name, "https://hosted.example.test");
      await expect(loadRunner()).rejects.toThrow("Refusing to override");
      expect(mocks.createClient).not.toHaveBeenCalled();
    },
  );

  it("rejects a missing anonymous key", async () => {
    mocks.execFileSync.mockReturnValue(status("http://127.0.0.1:54321", ""));
    await expect(loadRunner()).rejects.toThrow();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each(["localhost", "127.0.0.1", "[::1]"])(
    "seeds an owned fixture on %s and supplies the same synthetic identity to build and browser", async (host) => {
      const origin = `http://${host}:54321`;
      mocks.execFileSync.mockReturnValue(status(origin));
      vi.stubEnv("SUPABASE_URL", `${origin}/`);
      await loadRunner();

      expect(mocks.execFileSync).toHaveBeenCalledWith("supabase", ["status", "-o", "env"], expect.any(Object));
      expect(mocks.createClient).toHaveBeenCalledWith(`${origin}/`, "synthetic-anon-key", {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const identity = mocks.signUp.mock.calls[0][0];
      expect(identity.email).toMatch(/^c26-.+@example\.test$/);
      expect(identity.password).toMatch(/^LocalC26-[a-f0-9]{40}!$/);
      expect(mocks.from).toHaveBeenCalledWith("grimoires");
      expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ owner_id: "synthetic-owner" }));
      expect(mocks.spawnSync).toHaveBeenCalledTimes(2);
      const [build, browser] = mocks.spawnSync.mock.calls;
      expect(build.slice(0, 2)).toEqual(["npm", ["exec", "--", "next", "build", "--webpack"]]);
      expect(browser[1]).toEqual([
        "exec", "--", "playwright", "test",
        "tests/e2e/grimoires-workspace.spec.ts", "tests/e2e/practice.spec.ts",
        "tests/e2e/sanctuary.spec.ts", "--config=playwright.local-auth.config.ts",
      ]);
      expect(build[2].env).toMatchObject({
        E2E_EMAIL: identity.email, E2E_PASSWORD: identity.password,
        NEXT_PUBLIC_SUPABASE_URL: "https://127.0.0.1:54443/",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "synthetic-anon-key",
        NODE_EXTRA_CA_CERTS: "/synthetic/c26-tls/localhost.crt",
      });
      expect(browser[2].env).toEqual(build[2].env);
      const logs = console.log.mock.calls.flat().join(" ");
      expect(logs).not.toContain(identity.password);
      expect(logs).not.toContain("synthetic-session");
      expect(mocks.kill).toHaveBeenCalledOnce();
      expect(mocks.rmSync).toHaveBeenCalledWith("/synthetic/c26-tls", { recursive: true, force: true });
    },
  );

  it.each([
    { data: null, error: { message: "synthetic signup failure" } },
    { data: { user: { id: "synthetic-owner" }, session: null }, error: null },
  ])("stops before seeding if signup fails or yields no session", async (result) => {
    mocks.signUp.mockResolvedValue(result);
    await expect(loadRunner()).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.spawn).not.toHaveBeenCalled();
  });

  it("stops before creating TLS files if fixture insertion fails", async () => {
    mocks.single.mockResolvedValue({ data: null, error: { message: "synthetic seed failure" } });
    await expect(loadRunner()).rejects.toThrow("Synthetic grimoire seed failed");
    expect(mocks.mkdtempSync).not.toHaveBeenCalled();
    expect(mocks.spawnSync).not.toHaveBeenCalled();
  });

  it.each([
    { status: 1, signal: null },
    { status: null, signal: "SIGTERM" },
    { error: new Error("synthetic process failure") },
  ])("cleans up and skips browser execution after a failed build %j", async (result) => {
    mocks.spawnSync.mockReturnValueOnce(result);
    await expect(loadRunner()).rejects.toThrow();
    expect(mocks.spawnSync).toHaveBeenCalledOnce();
    expect(mocks.kill).toHaveBeenCalledOnce();
    expect(mocks.rmSync).toHaveBeenCalledWith("/synthetic/c26-tls", { recursive: true, force: true });
  });

  it("reports a failing browser run and still removes TLS material and the proxy", async () => {
    mocks.spawnSync.mockReturnValueOnce({ status: 0, signal: null }).mockReturnValueOnce({ status: 1, signal: null });
    await expect(loadRunner()).rejects.toThrow("Authenticated Next.js E2E failed");
    expect(mocks.kill).toHaveBeenCalledOnce();
    expect(mocks.rmSync).toHaveBeenCalledOnce();
  });

  it("cleans up without building when the proxy exits before readiness", async () => {
    mocks.spawn.mockReturnValue({ exitCode: 1, kill: mocks.kill });
    await expect(loadRunner()).rejects.toThrow("Loopback HTTPS test gateway failed to start");
    expect(mocks.spawnSync).not.toHaveBeenCalled();
    expect(mocks.kill).not.toHaveBeenCalled();
    expect(mocks.rmSync).toHaveBeenCalledTimes(1);
  });

  it("surfaces a concise subprocess failure annotation in GitHub Actions", async () => {
    mocks.spawnSync.mockReturnValueOnce({ status: 0, signal: null });
    mocks.spawnSync.mockReturnValueOnce({
      status: 1,
      signal: null,
      stdout: "1 failed\nError: expected URL to match /santuario/\nReceived: /login\n",
      stderr: "",
    });

    await expect(run()).rejects.toThrow("Authenticated Next.js E2E failed");

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("::error title=Authenticated Next.js E2E failure::Error: expected URL"),
    );
  });

  it.each([
    ["build", { status: 1, signal: null }],
    ["build", { status: null, signal: "SIGTERM" }],
    ["build", { error: new Error("build process failed") }],
    ["journeys", { status: 1, signal: null }],
    ["journeys", { status: null, signal: "SIGTERM" }],
    ["journeys", { error: new Error("journey process failed") }],
  ])("cleans up after %s subprocess failure (%j)", async (stage, result) => {
    if (stage === "journeys") mocks.spawnSync.mockReturnValueOnce({ status: 0, signal: null });
    mocks.spawnSync.mockReturnValueOnce(result);
    await expect(run()).rejects.toThrow();
    expect(mocks.spawnSync).toHaveBeenCalledTimes(stage === "build" ? 1 : 2);
    expect(mocks.kill).toHaveBeenCalledTimes(1);
    expect(mocks.rmSync).toHaveBeenCalledWith("/tmp/aa-c26-unit-tls", { recursive: true, force: true });
  });
});
