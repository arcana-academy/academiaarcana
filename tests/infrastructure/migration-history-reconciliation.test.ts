import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const reconciliationPath = resolve(
  process.cwd(),
  "docs/architecture/AA-SUPABASE-MIGRATION-RECONCILIATION-2026-10-04.md",
);

const migrationFiles = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const reconciliation = readFileSync(reconciliationPath, "utf8");

const historicalMappings = [
  ["20260929124554_product_social_focus", "20260929153000_focus_social_foundation.sql"],
  ["20260929142350_harden_friend_connection_updates", "20260929153000_focus_social_foundation.sql"],
  ["20260929201711_feedback_hub", "20260929202000_feedback_hub.sql"],
  ["20260929201757_feedback_hub_permissions", "20260929202000_feedback_hub.sql"],
  ["20260929202937_feedback_hub_require_authenticated_owner", "20260929210000_feedback_hub_require_authenticated_owner.sql"],
] as const;

describe("Supabase migration history reconciliation", () => {
  it("keeps repository migration versions unique and lexically ordered", () => {
    const versions = migrationFiles.map((name) => name.slice(0, 14));

    expect(new Set(versions).size).toBe(versions.length);
    expect([...migrationFiles].sort()).toEqual(migrationFiles);
    expect(versions.every((version) => /^\d{14}$/.test(version))).toBe(true);
  });

  it("preserves the production-only historical identifiers as documented evidence", () => {
    for (const [historicalId, canonicalFile] of historicalMappings) {
      expect(reconciliation).toContain(`\`${historicalId}\``);
      expect(reconciliation).toContain(`\`${canonicalFile}\``);
      expect(migrationFiles).toContain(canonicalFile);
      expect(migrationFiles.some((name) => name.startsWith(`${historicalId}_`))).toBe(false);
    }
  });

  it("keeps the explicitly reconciled least-privilege production version", () => {
    expect(migrationFiles).toContain(
      "20260928005837_20260928005514_tighten_product_rpc_execute_grants.sql",
    );
    expect(reconciliation).toContain("Production history remains authoritative historical evidence");
    expect(reconciliation).toContain("Repository migration files remain the canonical forward migration source");
  });
});
