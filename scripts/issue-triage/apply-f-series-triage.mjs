#!/usr/bin/env node
/**
 * F7 safety checkpoint — read-only issue triage.
 *
 * This program is intentionally incapable of commenting on or closing issues.
 * In particular, --apply is rejected. Do not re-enable writes without a new
 * owner-approved, per-issue evidence review and a separate code change.
 *
 * Usage:
 *   node scripts/issue-triage/apply-f-series-triage.mjs             # dry run
 *   node scripts/issue-triage/apply-f-series-triage.mjs --dry-run   # dry run
 *   node scripts/issue-triage/apply-f-series-triage.mjs --check     # contract checks
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const allowedArgs = new Set(["--dry-run", "--check"]);
const rejected = argv.filter((arg) => !allowedArgs.has(arg));

if (rejected.length > 0) {
  console.error(
    "BLOCKED: issue mutations are disabled in F7. Unsupported arguments: " +
      rejected.join(", "),
  );
  process.exitCode = 2;
} else {
  try {
    const base = dirname(fileURLToPath(import.meta.url));
    const input = JSON.parse(readFileSync(join(base, "f-series-resolution.json"), "utf8"));
    if (input.autoClose !== false || input.validation?.policy !== "REPORT_ONLY_NO_ISSUE_WRITES") {
      throw new Error("The non-mutating F7 policy is missing or changed.");
    }
    if (!Array.isArray(input.entries) || input.entries.length !== 91) {
      throw new Error("Expected exactly 91 mapped F1-F5 issues.");
    }
    if (!Array.isArray(input.additionalReferences) || input.additionalReferences.length !== 4) {
      throw new Error("Expected exactly four additional PR references.");
    }

    const ids = new Set();
    const statuses = new Set(["CANÔNICO", "PARCIAL", "LACUNA"]);
    const expectedExtras = new Set([53, 55, 56, 186]);
    let partialOrGap = 0;
    let duplicateReview = 0;
    const rows = [];

    for (const entry of input.entries) {
      if (!Number.isInteger(entry.issue) || ids.has(entry.issue) || !statuses.has(entry.status)) {
        throw new Error("Invalid or duplicate mapped issue identifier/status.");
      }
      if (typeof entry.document !== "string" || !entry.document.startsWith("AA-SPEC-F")) {
        throw new Error("Mapping missing a canonical specification filename.");
      }
      ids.add(entry.issue);
      if (entry.status === "PARCIAL" || entry.status === "LACUNA") partialOrGap += 1;

      const disposition = entry.duplicateOf
        ? "REVIEW_EXACT_DUPLICATE"
        : entry.status === "CANÔNICO"
          ? "DOCUMENTED_REVIEW_ONLY"
          : "BLOCKED_" + entry.status;
      if (entry.duplicateOf) duplicateReview += 1;
      rows.push({ issue: entry.issue, status: entry.status, disposition });
    }

    for (const ref of input.additionalReferences) {
      if (!expectedExtras.delete(ref.issue) || ids.has(ref.issue)) {
        throw new Error("Unexpected or duplicate additional closing reference.");
      }
      if (!["REVIEW_DUPLICATE_ONLY", "BLOCKED_RECONCILE_REQUIREMENTS", "BLOCKED_KEEP_OPEN"].includes(ref.decision)) {
        throw new Error("Invalid additional closing reference disposition.");
      }
      ids.add(ref.issue);
      rows.push({ issue: ref.issue, status: "DOCUMENTADO", disposition: ref.decision });
    }
    if (ids.size !== 95 || expectedExtras.size !== 0) {
      throw new Error("Mismatch against the 95 original closing references.");
    }
    for (const id of [167, 168]) {
      const entry = input.entries.find((item) => item.issue === id);
      if (entry?.duplicateOf !== null || entry?.status !== "PARCIAL") {
        throw new Error("F5.14/F5.15 classification must preserve both requirements.");
      }
    }
    if (argv.includes("--check")) {
      console.log(
        "PASS read-only F7 mapping: 95/95 unique; 91 F-series; 4 additional; " +
          partialOrGap + " PARCIAL/LACUNA; " + duplicateReview + " internal duplicate reviews.",
      );
    } else {
      for (const row of rows.sort((a, b) => a.issue - b.issue)) {
        console.log(
          "[dry-run] #" + row.issue + " " + row.status + " -> " +
            row.disposition + " (NO WRITE)",
        );
      }
      console.log(
        "F7: 95/95 reviewed as metadata; 0 comments; 0 issues closed. " +
          "PR #821 still contains auto-closing references in its BODY. DO NOT MERGE it unchanged.",
      );
    }
  } catch (error) {
    console.error("BLOCKED: F7 mapping validation failed: " + error.message);
    process.exitCode = 1;
  }
}
