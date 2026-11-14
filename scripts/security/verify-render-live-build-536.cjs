"use strict";

/**
 * P0 #536: read-only comparison of a sanitized Render service metadata snapshot
 * against the canonical Git-backed build contract.
 *
 * This does NOT isolate secrets or authorize a deploy. Never print metadata,
 * variable names, secret values, or raw errors from provider responses.
 */
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const SERVICE_ID = "srv-dauor697lnhs739cicag";
const WORKSPACE_ID = "tea-daa6v6tg1s2s73cb5gi0";
const REPOSITORY = "https://github.com/arcana-academy/academiaarcana";
const GUARD = "node scripts/security/assert-build-secret-isolation-536.cjs";

function refuse() {
  throw new Error("P0 #536: Render build contract NOT VERIFIED; NO-GO.");
}

function declaredBuildCommand(renderYaml) {
  if (typeof renderYaml !== "string") refuse();
  if (!/^\s*autoDeployTrigger:\s*"off"\s*$/m.test(renderYaml)) refuse();
  const directives = [...renderYaml.matchAll(/^\s*buildCommand:\s*(\S[^\r\n]*)\s*$/gm)];
  if (directives.length !== 1) refuse();
  const command = directives[0][1].trim();
  // The guard must precede *all* installation, rebuild and compilation steps.
  if (!command.startsWith(`${GUARD} && `)) refuse();
  if (!command.includes("npm ci --ignore-scripts")) refuse();
  if (!command.endsWith(" && npm run build")) refuse();
  return command;
}

function verifyLiveBuildContract(service, renderYaml) {
  const declared = declaredBuildCommand(renderYaml);
  if (!service || typeof service !== "object") refuse();
  if (service.id !== SERVICE_ID || service.ownerId !== WORKSPACE_ID ||
      service.name !== "academiaarcana" ||
      service.repo !== REPOSITORY || service.branch !== "main" ||
      service.autoDeploy !== "no" || service.autoDeployTrigger !== "off" ||
      service.serviceDetails?.runtime !== "node" ||
      service.serviceDetails?.plan !== "free" ||
      service.serviceDetails?.healthCheckPath !== "/api/health") refuse();
  const actual = service.serviceDetails?.envSpecificDetails?.buildCommand;
  // Intentionally compare complete commands: extra shell steps may bypass
  // safeguards even if the expected guard appears as a substring.
  if (typeof actual !== "string" || actual !== declared) refuse();
  return true;
}

module.exports = { declaredBuildCommand, verifyLiveBuildContract };

if (require.main === module) {
  try {
    const metadata = JSON.parse(readFileSync(0, "utf8"));
    const renderYaml = readFileSync(resolve(__dirname, "../../render.yaml"), "utf8");
    verifyLiveBuildContract(metadata, renderYaml);
    process.stdout.write("P0 #536: Render Git-backed build contract MATCH. Secret isolation NOT attested.\n");
  } catch {
    process.stderr.write("P0 #536: Render Git-backed build contract NOT VERIFIED; NO-GO.\n");
    process.exitCode = 1;
  }
}
