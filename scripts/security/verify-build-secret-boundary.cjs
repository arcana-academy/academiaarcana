/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

// Fail closed before any dependency/build code runs. Examine only env NAMES,
// never values, and never log the value of a runtime credential.
const runtimeOnly = new Set([
  "OPENAI_API_KEY",
  "PARALLEL_API_KEY",
  "EXA_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "DATABASE_URL",
  "RENDER_DEPLOY_HOOK_URL",
  "GITHUB_TOKEN",
  "TODOIST_CLIENT_SECRET",
  "NOTION_CLIENT_SECRET",
  "ASANA_CLIENT_SECRET",
  "TRELLO_CLIENT_SECRET",
  "MICROSOFT_CLIENT_SECRET",
  "MICROSOFT_ENTRA_CLIENT_SECRET",
  "OUTLOOK_CALENDAR_SESSION_SECRET",
  "DATACAMP_API_KEY",
  "AIRTABLE_PERSONAL_ACCESS_TOKEN",
  "DROPBOX_RUNTIME_TOKEN",
  "MICROSOFT_GRAPH_ACCESS_TOKEN",
]);
const credentialNamePattern = /(?:^|_)(?:API_KEY|API_TOKEN|AUTH_TOKEN|ACCESS_TOKEN|REFRESH_TOKEN|PERSONAL_ACCESS_TOKEN|CLIENT_SECRET|SESSION_SECRET|SERVICE_ROLE_KEY|SECRET_KEY|PRIVATE_KEY|PASSWORD|DEPLOY_HOOK_URL|SECRET)$/i;

/** Reject configured runtime credentials before dependency install or build.
 * @param {Record<string, string | undefined>} env
 */
function assertBuildSecretIsolation(env) {
  const exposed = Object.keys(env).filter(name =>
    !name.startsWith("NEXT_PUBLIC_") &&
    (runtimeOnly.has(name) || credentialNamePattern.test(name))
  );
  if (exposed.length) {
    throw new Error(
      "BUILD SECRET BOUNDARY NO-GO: runtime credentials are visible to build code (" +
      exposed.length +
      " configured key names). Move to a runtime-only secret mechanism; values are never read or logged."
    );
  }
  return true;
}

module.exports = { assertBuildSecretIsolation };

if (require.main === module) {
  try {
    assertBuildSecretIsolation(process.env);
    process.stdout.write("Build-time runtime-secret boundary: PASS.\n");
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}
