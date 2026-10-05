import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const reconciliationPath = resolve(
  process.cwd(),
  "docs/architecture/AA-SUPABASE-MIGRATION-RECONCILIATION-2026-10-04.md",
);

const migrationFiles = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const versions = migrationFiles.map((name) => name.slice(0, 14));
if (new Set(versions).size !== versions.length) {
  throw new Error("Duplicate Supabase migration version detected.");
}
if (!versions.every((version) => /^\d{14}$/.test(version))) {
  throw new Error("Every Supabase migration must start with a 14-digit version.");
}

const reconciliation = readFileSync(reconciliationPath, "utf8");
const mappings = [
  ["20260929124554_product_social_focus", "20260929153000_focus_social_foundation.sql"],
  ["20260929142350_harden_friend_connection_updates", "20260929153000_focus_social_foundation.sql"],
  ["20260929201711_feedback_hub", "20260929202000_feedback_hub.sql"],
  ["20260929201757_feedback_hub_permissions", "20260929202000_feedback_hub.sql"],
  ["20260929202937_feedback_hub_require_authenticated_owner", "20260929210000_feedback_hub_require_authenticated_owner.sql"],
];

for (const [historicalId, canonicalFile] of mappings) {
  if (!reconciliation.includes(`\`${historicalId}\``)) {
    throw new Error(`Missing production-history reconciliation for ${historicalId}.`);
  }
  if (!reconciliation.includes(`\`${canonicalFile}\``)) {
    throw new Error(`Missing canonical mapping for ${historicalId} -> ${canonicalFile}.`);
  }
  if (!migrationFiles.includes(canonicalFile)) {
    throw new Error(`Canonical migration file is missing: ${canonicalFile}.`);
  }
  if (migrationFiles.some((name) => name.startsWith(`${historicalId}_`))) {
    throw new Error(`Historical production identifier was fabricated into repository history: ${historicalId}.`);
  }
}

const leastPrivilege =
  "20260928005837_20260928005514_tighten_product_rpc_execute_grants.sql";
if (!migrationFiles.includes(leastPrivilege)) {
  throw new Error("Reconciled least-privilege migration version is missing.");
}

console.log(
  `Migration history guard passed: ${migrationFiles.length} repository migrations, ${mappings.length} documented production-only identifiers.`,
);
