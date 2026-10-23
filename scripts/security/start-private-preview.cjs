#!/usr/bin/env node
"use strict";

const { spawn } = require("node:child_process");

const required = process.env.AA_PRIVATE_PREVIEW === "required";
const password = process.env.AA_PRIVATE_PREVIEW_PASSWORD;
const protectedVars = [
  "OPENAI_API_KEY",
  "EXA_API_KEY",
  "PARALLEL_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "RENDER_DEPLOY_HOOK_URL",
];
const exposed = protectedVars.filter((name) => Boolean(process.env[name]));

if (!required || !password || Buffer.byteLength(password, "utf8") < 32 || exposed.length) {
  // Deliberately never print environment variable values or preview credentials.
  console.error(
    "Private preview startup refused: enable AA_PRIVATE_PREVIEW=required, " +
    "provide a distinct high-entropy preview password (32+ bytes), " +
    "and remove production/service secrets from the preview environment.",
  );
  process.exitCode = 1;
} else {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const child = spawn(npmCommand, ["start"], {
    stdio: "inherit",
    env: process.env,
  });
  for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () => child.kill(signal));
  }
  child.on("error", () => { process.exitCode = 1; });
  child.on("exit", (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
  });
}
