// @vitest-environment node

import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Exercise the executable module with every process, filesystem and network
// boundary replaced. No Supabase, certificate, build or browser is started.
const mocks = vi.hoisted(() => ({
  execFileSync: vi.fn(), spawn: vi.fn(), spawnSync: vi.fn(),
  mkdtempSync: vi.fn(), rmSync: vi.fn(), connect: vi.fn(),
  createClient: vi.fn(), signUp: vi.fn(), from: vi.fn(),
  insert: vi.fn(), select: vi.fn(), single: vi.fn(), kill: vi.fn(),
}));
vi.mock("node:child_process", () => ({ execFileSync: mocks.execFileSync, spawn: mocks.spawn, spawnSync: mocks.spawnSync }));
vi.mock("node:fs", () => ({ mkdtempSync: mocks.mkdtempSync, rmSync: mocks.rmSync }));
vi.mock("node:net", () => ({ connect: mocks.connect }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));

const run = () => import("./test-local-authenticated-nextjs-e2e.mjs");
const statusOutput = (url = "http://127.0.0.1:54321", key = "synthetic-anon-key") =>
  `# local status\r\nAPI_URL="${url}"\r\nANON_KEY='${key}'\r\n`;

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv("GITHUB_ACTIONS", "true");
  vi.stubEnv("GITHUB_EVENT_NAME", "pull_request");
  vi.stubEnv("AA_LOCAL_SUPABASE_E2E", "1");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_URL", "");
  vi.spyOn(console, "log").mockImplementation(() => {});
  mocks.execFileSync.mockReturnValue(statusOutput());
  mocks.createClient.mockReturnValue({ auth: { signUp: mocks.signUp }, from: mocks.from });
  mocks.signUp.mockResolvedValue({ data: { user: { id: "synthetic-user" }, session: { access_token: "synthetic-token" } }, error: null });
  mocks.from.mockReturnValue({ insert: mocks.insert });
  mocks.insert.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ single: mocks.single });
  mocks.single.mockResolvedValue({ data: { id: "synthetic-grimoire" }, error: null });
  mocks.mkdtempSync.mockReturnValue("/tmp/aa-c26-unit-tls");
  mocks.spawn.mockReturnValue({ exitCode: null, kill: mocks.kill });
  mocks.spawnSync.mockReturnValue({ status: 0, signal: null });
  mocks.connect.mockImplementation(() => {
    const socket = new EventEmitter();
    socket.destroy = vi.fn();
    queueMicrotask(() => socket.emit("connect"));
    return socket;
  });
});

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("local authenticated Next.js runner guards", () => {
  it.each([
    ["GITHUB_ACTIONS", "false"], ["GITHUB_ACTIONS", ""],
    ["GITHUB_EVENT_NAME", "push"], ["GITHUB_EVENT_NAME", "pull_request_target"],
    ["AA_LOCAL_SUPABASE_E2E", "0"], ["AA_LOCAL_SUPABASE_E2E", ""],
  ])("rejects %s=%s before invoking any local tools", async (name, value) => {
    vi.stubEnv(name, value);
    await expect(run()).rejects.toThrow();
    expect(mocks.execFileSync).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each([
    "https://127.0.0.1:54321", "http://example.test:54321",
    "http://127.0.0.1.example.test", "http://0.0.0.0:54321",
    "http://127.0.0.1:54321/rest/v1", "http://127.0.0.1:54321/?query=1",
    "http://127.0.0.1:54321/#fragment", "http://user@127.0.0.1:54321",
    "http://user:password@127.0.0.1:54321", "not-a-url",
  ])("refuses unsafe Supabase status URL %s before creating an identity", async (url) => {
    mocks.execFileSync.mockReturnValueOnce(statusOutput(url));
    await expect(run()).rejects.toThrow();
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.spawn).not.toHaveBeenCalled();
  });

  it("requires the local anonymous key", async () => {
    mocks.execFileSync.mockReturnValueOnce(statusOutput("http://127.0.0.1:54321", ""));
    await expect(run()).rejects.toThrow();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"])("refuses an existing mismatched %s", async (name) => {
    vi.stubEnv(name, "https://hosted.example.test");
    await expect(run()).rejects.toThrow("Refusing to override an existing non-local " + name);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each(["http://localhost:54321", "http://[::1]:54321", "http://127.0.0.1:54321"])(
    "accepts local origin %s and a matching existing origin",
    async (url) => {
      mocks.execFileSync.mockReturnValueOnce(statusOutput(url));
      vi.stubEnv("SUPABASE_URL", url + "/");
      await run();
      expect(mocks.createClient).toHaveBeenCalledWith(url + "/", "synthetic-anon-key", {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    },
  );
});

describe("synthetic runner orchestration and cleanup", () => {
  it("seeds the signed-up owner and runs only the three selected journeys with the local TLS environment", async () => {
    await run();
    expect(mocks.execFileSync).toHaveBeenNthCalledWith(1, "supabase", ["status", "-o", "env"], { encoding: "utf8", timeout: 30_000 });
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: expect.stringMatching(/^c26-[\da-f-]+@example\.test$/),
      password: expect.stringMatching(/^LocalC26-[\da-f]{40}!$/),
    });
    expect(mocks.from).toHaveBeenCalledWith("grimoires");
    expect(mocks.insert).toHaveBeenCalledWith({ owner_id: "synthetic-user", title: "Grimório sintético C26" });
    const environment = mocks.spawnSync.mock.calls[0][2].env;
    expect(environment).toMatchObject({
      NODE_EXTRA_CA_CERTS: "/tmp/aa-c26-unit-tls/localhost.crt",
      NEXT_PUBLIC_SUPABASE_URL: "https://127.0.0.1:54443/",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "synthetic-anon-key",
      E2E_EMAIL: mocks.signUp.mock.calls[0][0].email,
      E2E_PASSWORD: mocks.signUp.mock.calls[0][0].password,
    });
    expect(mocks.spawnSync).toHaveBeenNthCalledWith(1, "npm", ["exec", "--", "next", "build", "--webpack"], expect.objectContaining({ env: environment }));
    expect(mocks.spawnSync).toHaveBeenNthCalledWith(2, "npm", [
      "exec", "--", "playwright", "test", "tests/e2e/grimoires-workspace.spec.ts",
      "tests/e2e/practice.spec.ts", "tests/e2e/sanctuary.spec.ts", "--config=playwright.local-auth.config.ts",
    ], expect.objectContaining({ env: environment }));
    expect(mocks.spawnSync).toHaveBeenCalledTimes(2);
    expect(mocks.kill).toHaveBeenCalledTimes(1);
    expect(mocks.rmSync).toHaveBeenCalledWith("/tmp/aa-c26-unit-tls", { recursive: true, force: true });
    const output = console.log.mock.calls.flat().join("\n");
    expect(output).not.toContain(environment.E2E_PASSWORD);
    expect(output).not.toContain("synthetic-token");
  });

  it.each([
    { data: null, error: { message: "signup denied" } },
    { data: { user: { id: "synthetic-user" }, session: null }, error: null },
  ])("stops before seeding when signup fails or returns no session ($error)", async (reply) => {
    mocks.signUp.mockResolvedValueOnce(reply);
    await expect(run()).rejects.toThrow();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.mkdtempSync).not.toHaveBeenCalled();
  });

  it.each([
    { data: null, error: { message: "seed denied" } },
    { data: {}, error: null },
  ])("stops before TLS setup when grimoire seeding fails ($error)", async (reply) => {
    mocks.single.mockResolvedValueOnce(reply);
    await expect(run()).rejects.toThrow();
    expect(mocks.mkdtempSync).not.toHaveBeenCalled();
    expect(mocks.spawnSync).not.toHaveBeenCalled();
  });

  it("removes temporary TLS files when certificate generation fails", async () => {
    mocks.execFileSync.mockImplementation((command) => {
      if (command === "supabase") return statusOutput();
      throw new Error("openssl failed");
    });
    await expect(run()).rejects.toThrow("openssl failed");
    expect(mocks.spawn).not.toHaveBeenCalled();
    expect(mocks.rmSync).toHaveBeenCalledWith("/tmp/aa-c26-unit-tls", { recursive: true, force: true });
  });

  it("does not build when the TLS proxy exits before readiness", async () => {
    mocks.spawn.mockReturnValueOnce({ exitCode: 1, kill: mocks.kill });
    await expect(run()).rejects.toThrow("Loopback HTTPS test gateway failed to start");
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
