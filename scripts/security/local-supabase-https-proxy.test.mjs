// @vitest-environment node

import { EventEmitter, once } from "node:events";
import { PassThrough } from "node:stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createServer: vi.fn(), request: vi.fn(), readFileSync: vi.fn(), listen: vi.fn() }));
vi.mock("node:https", () => ({ default: { createServer: mocks.createServer } }));
vi.mock("node:http", () => ({ default: { request: mocks.request } }));
vi.mock("node:fs", () => ({ readFileSync: mocks.readFileSync }));

const run = () => import("./local-supabase-https-proxy.mjs");

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  for (const [name, value] of Object.entries({
    GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "pull_request", AA_LOCAL_SUPABASE_E2E: "1",
    AA_LOCAL_SUPABASE_ORIGIN: "http://127.0.0.1:54321", AA_LOCAL_TLS_PORT: "54443",
    AA_LOCAL_TLS_KEY_FILE: "/synthetic/localhost.key", AA_LOCAL_TLS_CERT_FILE: "/synthetic/localhost.crt",
  })) vi.stubEnv(name, value);
  mocks.readFileSync.mockReturnValue("synthetic TLS material");
  mocks.createServer.mockReturnValue({ listen: mocks.listen });
});
afterEach(() => { vi.unstubAllEnvs(); });

describe("local Supabase HTTPS proxy boundaries", () => {
  it.each([
    ["GITHUB_ACTIONS", "false"], ["GITHUB_EVENT_NAME", "push"], ["AA_LOCAL_SUPABASE_E2E", "0"],
    ["AA_LOCAL_SUPABASE_ORIGIN", "https://127.0.0.1:54321"],
    ["AA_LOCAL_SUPABASE_ORIGIN", "http://remote.example.test"],
    ["AA_LOCAL_SUPABASE_ORIGIN", "http://127.0.0.1.example.test"],
    ["AA_LOCAL_SUPABASE_ORIGIN", "http://0.0.0.0:54321"],
    ["AA_LOCAL_SUPABASE_ORIGIN", "http://127.0.0.1:54321/path"],
    ["AA_LOCAL_SUPABASE_ORIGIN", "http://127.0.0.1:54321/?query=1"],
    ["AA_LOCAL_SUPABASE_ORIGIN", "http://127.0.0.1:54321/#fragment"],
    ["AA_LOCAL_TLS_PORT", "1023"], ["AA_LOCAL_TLS_PORT", "65536"],
    ["AA_LOCAL_TLS_PORT", "54443.5"], ["AA_LOCAL_TLS_PORT", "NaN"], ["AA_LOCAL_TLS_PORT", ""],
  ])("rejects %s=%s before reading files or opening a listener", async (name, value) => {
    vi.stubEnv(name, value);
    await expect(run()).rejects.toThrow();
    expect(mocks.readFileSync).not.toHaveBeenCalled();
    expect(mocks.createServer).not.toHaveBeenCalled();
  });

  it.each(["1024", "65535"])("accepts boundary port %s and binds only IPv4 loopback", async (port) => {
    vi.stubEnv("AA_LOCAL_TLS_PORT", port);
    await run();
    expect(mocks.readFileSync.mock.calls).toEqual([["/synthetic/localhost.key"], ["/synthetic/localhost.crt"]]);
    expect(mocks.listen).toHaveBeenCalledWith(Number(port), "127.0.0.1");
  });

  it("forwards method, path, headers and body to the fixed local upstream", async () => {
    await run();
    const handler = mocks.createServer.mock.calls[0][1];
    const upstream = new EventEmitter();
    mocks.request.mockReturnValue(upstream);
    const request = { method: "POST", url: "/auth/v1/token?grant_type=password", headers: { host: "127.0.0.1:54443", "content-type": "application/json" }, pipe: vi.fn() };
    const response = { writeHead: vi.fn(), end: vi.fn() };
    handler(request, response);
    expect(mocks.request).toHaveBeenCalledWith({
      hostname: "127.0.0.1", port: "54321", method: "POST", path: request.url,
      headers: { host: "127.0.0.1:54321", "content-type": "application/json" },
    }, expect.any(Function));
    expect(request.pipe).toHaveBeenCalledWith(upstream);
    const upstreamResponse = { statusCode: 201, headers: { "content-type": "application/json" }, pipe: vi.fn() };
    mocks.request.mock.calls[0][1](upstreamResponse);
    expect(response.writeHead).toHaveBeenCalledWith(201, upstreamResponse.headers);
    expect(upstreamResponse.pipe).toHaveBeenCalledWith(response);
  });

  it("preserves actual request and response bytes across the local HTTPS bridge", async () => {
    await run();
    const handler = mocks.createServer.mock.calls[0][1];
    const browserRequest = new PassThrough();
    Object.assign(browserRequest, {
      method: "POST",
      url: "/auth/v1/token?grant_type=password",
      headers: {
        host: "127.0.0.1:54443",
        "content-type": "application/json",
        apikey: "synthetic-publishable-key",
      },
    });
    const browserResponse = new PassThrough();
    browserResponse.writeHead = vi.fn();

    const upstreamRequest = new PassThrough();
    const receivedByUpstream = [];
    upstreamRequest.on("data", (chunk) => receivedByUpstream.push(chunk));
    mocks.request.mockReturnValue(upstreamRequest);

    handler(browserRequest, browserResponse);
    browserRequest.end('{"synthetic":"credentials"}');
    await once(upstreamRequest, "finish");

    expect(mocks.request).toHaveBeenCalledWith({
      hostname: "127.0.0.1",
      port: "54321",
      method: "POST",
      path: "/auth/v1/token?grant_type=password",
      headers: { ...browserRequest.headers, host: "127.0.0.1:54321" },
    }, expect.any(Function));
    expect(Buffer.concat(receivedByUpstream).toString("utf8")).toBe('{"synthetic":"credentials"}');

    const upstreamResponse = new PassThrough();
    Object.assign(upstreamResponse, {
      statusCode: 201,
      headers: { "content-type": "application/json" },
    });
    const receivedByBrowser = [];
    browserResponse.on("data", (chunk) => receivedByBrowser.push(chunk));
    mocks.request.mock.calls[0][1](upstreamResponse);
    upstreamResponse.end('{"created":true}');
    await once(browserResponse, "finish");

    expect(browserResponse.writeHead).toHaveBeenCalledWith(201, upstreamResponse.headers);
    expect(Buffer.concat(receivedByBrowser).toString("utf8")).toBe('{"created":true}');
  });

  it.each([false, true])("ends an upstream failure safely when headersSent=%s", async (headersSent) => {
    await run();
    const upstream = new EventEmitter();
    mocks.request.mockReturnValue(upstream);
    const response = { headersSent, writeHead: vi.fn(), end: vi.fn() };
    mocks.createServer.mock.calls[0][1]({ method: "GET", url: "/rest/v1/grimoires", headers: {}, pipe: vi.fn() }, response);
    upstream.emit("error", new Error("upstream unavailable"));
    if (headersSent) expect(response.writeHead).not.toHaveBeenCalled();
    else expect(response.writeHead).toHaveBeenCalledWith(502);
    expect(response.end).toHaveBeenCalledTimes(1);
  });
});
