import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import http from "node:http";
import https from "node:https";
import { readFileSync } from "node:fs";

assert.equal(process.env.GITHUB_ACTIONS, "true");
assert.equal(process.env.GITHUB_EVENT_NAME, "workflow_dispatch");
assert.equal(process.env.GITHUB_REF, "refs/heads/work/aa360-c60-auth-e2e-exact-sha-dispatch-20261021");
assert.equal(process.env.AA_AUTH_DISPATCH_CANDIDATE_SHA, "c13748a5122b777b221ebc0325037ea967bc6d20");
assert.equal(
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  "c13748a5122b777b221ebc0325037ea967bc6d20",
  "Proxy must run only against the pinned synthetic candidate checkout",
);
assert.equal(process.env.AA_LOCAL_SUPABASE_E2E, "1");

const source = new URL(process.env.AA_LOCAL_SUPABASE_ORIGIN ?? "");
assert.equal(source.protocol, "http:");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(source.hostname));
assert.equal(source.pathname, "/");
assert.equal(source.search, "");
assert.equal(source.hash, "");

const port = Number(process.env.AA_LOCAL_TLS_PORT);
assert.ok(Number.isInteger(port) && port >= 1024 && port <= 65535);

const server = https.createServer({
  key: readFileSync(process.env.AA_LOCAL_TLS_KEY_FILE),
  cert: readFileSync(process.env.AA_LOCAL_TLS_CERT_FILE),
}, (request, response) => {
  const upstream = http.request({
    hostname: source.hostname,
    port: source.port,
    method: request.method,
    path: request.url,
    headers: { ...request.headers, host: source.host },
  }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });
  upstream.on("error", () => {
    if (!response.headersSent) response.writeHead(502);
    response.end();
  });
  request.pipe(upstream);
});

server.listen(port, "127.0.0.1");
