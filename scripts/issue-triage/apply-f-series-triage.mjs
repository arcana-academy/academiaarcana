#!/usr/bin/env node
/**
 * Applies the F-series triage recorded in `f-series-resolution.json`.
 *
 * The triage itself (mapping issue -> canonical spec section) is already
 * committed under `docs/specs/`. This script only performs the GitHub side:
 * one evidence comment per issue and, when the acceptance criterion is the
 * canonical definition itself, the closure.
 *
 * Requirements:
 *   - `gh` authenticated with an installation/token that has `issues: write`;
 *   - the repository checked out at the commit that contains `docs/specs/`.
 *
 * Safety:
 *   - `--dry-run` (default) prints what would happen and touches nothing;
 *   - a real run needs `--apply`;
 *   - the run fails closed if the GitHub API rejects the write, and reports
 *     every failure instead of silently skipping.
 *
 * Usage:
 *   node scripts/issue-triage/apply-f-series-triage.mjs            # dry run
 *   node scripts/issue-triage/apply-f-series-triage.mjs --apply    # writes
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const MAPPING_PATH = join(HERE, "f-series-resolution.json");
const BASE_URL =
  "https://github.com/arcana-academy/academiaarcana/blob/main/docs/specs";

const apply = process.argv.includes("--apply");

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8" });
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function buildComment(entry, commit) {
  const docUrl = `${BASE_URL}/${entry.document}`;
  const lines = ["## Série F — definição canônica registrada", ""];

  if (entry.duplicateOf) {
    lines.push(
      `Encerrando como **duplicata** de #${entry.duplicateOf}. O conteúdo canônico vive em **${entry.section}**.`,
      "",
    );
  } else {
    lines.push(
      `**Seção:** ${entry.section}`,
      `**Documento:** [\`docs/specs/${entry.document}\`](${docUrl})`,
      `**Estado:** **${entry.status}**`,
    );
    if (entry.gap) {
      lines.push(
        `**Lacuna rastreada:** \`${entry.gap}\` em [\`docs/specs/AA-SPEC-GAP-REGISTER.md\`](${BASE_URL}/AA-SPEC-GAP-REGISTER.md)`,
      );
    }
    lines.push("", entry.note, "");
  }

  lines.push(
    "### Critério de encerramento",
    "O aceite desta issue é a **definição canônica** (fronteira, contrato, teste ou implementação) agora " +
      "versionada e ancorada em arquivo real do repositório. Encerrar **não** declara resolvida qualquer " +
      "lacuna de implementação: lacunas seguem listadas com ID estável no registro.",
    "",
    `Commit de referência: \`${commit}\` · triagem completa em ` +
      `[\`docs/specs/AA-ISSUE-TRIAGE-2026-10-24.md\`](${BASE_URL}/AA-ISSUE-TRIAGE-2026-10-24.md).`,
  );

  return lines.join("\n");
}

function main() {
  const mapping = JSON.parse(readFileSync(MAPPING_PATH, "utf8"));
  const entries = mapping.entries ?? [];
  const commit =
    process.env.GITHUB_SHA ?? git(["rev-parse", "HEAD"]).trim();

  let closed = 0;
  const failures = [];

  for (const entry of entries) {
    const body = buildComment(entry, commit);
    const reason = entry.duplicateOf ? "not planned" : "completed";

    if (!apply) {
      console.log(
        `[dry-run] #${entry.issue} <- ${entry.document} :: ${entry.status}` +
          (entry.gap ? ` (${entry.gap})` : "") +
          ` -> close:${reason}`,
      );
      continue;
    }

    try {
      gh(["issue", "comment", String(entry.issue), "--body", body]);
      gh(["issue", "close", String(entry.issue), "--reason", reason]);
      closed += 1;
      console.log(`[ok] #${entry.issue} commented and closed (${reason})`);
    } catch (error) {
      failures.push({ issue: entry.issue, message: String(error).slice(0, 200) });
      console.error(`[fail] #${entry.issue} ${String(error).split("\n")[0]}`);
    }
  }

  if (!apply) {
    console.log(`\ndry-run: ${entries.length} issue(s) would be processed.`);
    return;
  }

  console.log(`\napplied: ${closed}/${entries.length} issue(s) closed.`);
  if (failures.length > 0) {
    console.error(
      `\n${failures.length} failure(s). Most common cause: the GitHub token lacks ` +
        "`issues: write` (HTTP 403 Resource not accessible by integration).",
    );
    process.exitCode = 1;
  }
}

main();
