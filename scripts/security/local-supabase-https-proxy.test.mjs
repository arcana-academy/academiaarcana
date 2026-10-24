// @vitest-environment node

import { once } from "node:events";
import { PassThrough } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServer: vi.fn(), request: vi.fn(), readFileSync: vi.fn(), listen: vi.fn(),
}));
vi.mock("node:https", () => ({ default: { createServer: mocks.createServer } }));
vi.mock("node:http", () => ({ default: { request: mocks.request } }));
vi.mock("node:fs", () => ({ readFileSync: mocks.readFileSync }));

const loadProxy = () => import("./local-supabase-https-proxy.mjs");

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubEnv("GITHUB_ACTIONS", "true");
  vi.stubEnv("GITHUB_EVENT_NAME", "pull_request");
  vi.stubEnv("AA_LOCAL_SUPABASE_E2E", "1");
  vi.stubEnv("AA_LOCAL_SUPABASE_ORIGIN", "http://127.0.0.1:54321");
  vi.stubEnv("AA_LOCAL_TLS_PORT", "54443");
  vi.stubEnv("AA_LOCAL_TLS_KEY_FILE", "/synthetic/localhost.key");
  vi.stubEnv("AA_LOCAL_TLS_CERT_FILE", "/synthetic/localhost.crt");
  mocks.createServer.mockReturnValue({ listen: mocks.listen });
  mocks.readFileSync.mockImplementation((path) => Buffer.from(path));
});

afterEach(() => { vi.unstubAllEnvs(); });

describe("local Supabase HTTPS proxy", () => {
  it.each([
    ["GITHUB_ACTIONS", "false"], ["GITHUB_EVENT_NAME", "push"],
    ["AA_LOCAL_SUPABASE_E2E", "0"],
    ["AA_LOCAL_SUPABASE_ORIGIN", "https://127.0.0.1:54321"],
    ["AA_LOCAL_SUPABASE_ORIGIN", "http://localhost.example.test"],
    ["AA_LOCAL_SUPABASE_ORIGIN", "http://127.0.0.1:54321/auth"],
    ["AA_LOCAL_SUPABASE_ORIGIN", "http://127.0.0.1:54321/?query=1"],
    ["AA_LOCAL_SUPABASE_ORIGIN", "http://127.0.0.1:54321/#fragment"],
    ["AA_LOCAL_TLS_PORT", "1023"], ["AA_LOCAL_TLS_PORT", "65536"],
    ["AA_LOCAL_TLS_PORT", "54443.5"], ["AA_LOCAL_TLS_PORT", "invalid"],
  ])("rejects %s=%s before loading TLS material or listening", async (name, value) => {
    vi.stubEnv(name, value);
    await expect(loadProxy()).rejects.toThrow();
    expect(mocks.readFileSync).not.toHaveBeenCalled();
    expect(mocks.createServer).not.toHaveBeenCalled();
  });

  it.each([1024, 65535])("binds only loopback at accepted port boundary %s", async (port) => {
    vi.stubEnv("AA_LOCAL_TLS_PORT", String(port));
    await loadProxy();
    expect(mocks.listen).toHaveBeenCalledWith(port, "127.0.0.1");
    expect(mocks.createServer).toHaveBeenCalledWith({
      key: Buffer.from("/synthetic/localhost.key"), cert: Buffer.from("/synthetic/localhost.crt"),
    }, expect.any(Function));
  });

  it("forwards the request body, method, path and headers and preserves the upstream response", async () => {
    await loadProxy();
    const handle = mocks.createServer.mock.calls[0][1];
    const request = new PassThrough();
    Object.assign(request, {
      method: "POST", url: "/auth/v1/token?grant_type=password",
      headers: { host: "127.0.0.1:54443", "content-type": "application/json", apikey: "synthetic-anon" },
    });
    const response = new PassThrough();
    response.writeHead = vi.fn();
    const upstream = new PassThrough();
    const forwarded = [];
    upstream.on("data", (chunk) => forwarded.push(chunk));
    mocks.request.mockReturnValue(upstream);
    handle(request, response);
    request.end('{"synthetic":"payload"}');
    await once(upstream, "finish");

    expect(mocks.request).toHaveBeenCalledWith({
      hostname: "127.0.0.1", port: "54321", method: "POST",
      path: "/auth/v1/token?grant_type=password",
      headers: { ...request.headers, host: "127.0.0.1:54321" },
    }, expect.any(Function));
    expect(Buffer.concat(forwarded).toString()).toBe('{"synthetic":"payload"}');

    const upstreamResponse = new PassThrough();
    Object.assign(upstreamResponse, { statusCode: 201, headers: { "content-type": "application/json" } });
    const received = [];
    response.on("data", (chunk) => received.push(chunk));
    mocks.request.mock.calls[0][1](upstreamResponse);
    upstreamResponse.end('{"created":true}');
    await once(response, "finish");
    expect(response.writeHead).toHaveBeenCalledWith(201, upstreamResponse.headers);
    expect(Buffer.concat(received).toString()).toBe('{"created":true}');
  });

  it.each([false, true])("ends upstream errors without writing headers twice (headers sent: %s)", async (headersSent) => {
    await loadProxy();
    const upstream = new PassThrough();
    mocks.request.mockReturnValue(upstream);
    const request = new PassThrough();
    Object.assign(request, { method: "GET", url: "/rest/v1/grimoires", headers: {} });
    const response = { headersSent, writeHead: vi.fn(), end: vi.fn() };
    mocks.createServer.mock.calls[0][1](request, response);
    upstream.emit("error", new Error("synthetic upstream failure"));
    if (headersSent) expect(response.writeHead).not.toHaveBeenCalled();
    else expect(response.writeHead).toHaveBeenCalledWith(502);
    expect(response.end).toHaveBeenCalledOnce();
    request.destroy();
    upstream.destroy();
  });
});
