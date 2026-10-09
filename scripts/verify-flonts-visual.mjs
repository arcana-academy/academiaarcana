/**
 * Flonts visual-source verification. Read-only; no transforms or writes.
 * --strict is a mandatory release gate once approved assets are in the repo.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve, sep } from "node:path";

const manifestPath = resolve("docs/visual/FLONTS-VISUAL-LOCK.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const strict = process.argv.includes("--strict");
const root = resolve(manifest.root);
const allowed = new Set();
const statuses = [];
let problem = false;
for (const entry of manifest.files) {
  const basename = entry.filename;
  const assetPath = resolve(root, basename);
  if (
    typeof basename !== "string" ||
    !/^flonts-mago-[a-z0-9-]+\.(png|webp)$/.test(basename) ||
    !assetPath.startsWith(root + sep) ||
    allowed.has(basename) ||
    !/^[a-f0-9]{64}$/.test(entry.sha256)
  ) {
    problem = true;
    statuses.push({ file: basename, status: "INVALID_MANIFEST_ENTRY" });
    continue;
  }
  allowed.add(basename);
  if (!existsSync(assetPath)) {
    if (strict) problem = true;
    statuses.push({ file: basename, status: "MISSING" });
    continue;
  }
  const file = readFileSync(assetPath);
  const digest = createHash("sha256").update(file).digest("hex");
  const good = file.byteLength === entry.bytes && digest === entry.sha256;
  if (!good) problem = true;
  statuses.push({ file: basename, status: good ? "VALID" : "MISMATCH", bytes: file.byteLength });
}
if (manifest.asset_id !== "AA-ASSET-013" || manifest.files.length !== 5 || allowed.size !== 5) {
  problem = true;
}
process.stdout.write(JSON.stringify({
  assetId: manifest.asset_id, strict, verdict: problem ? "FAIL" : "PASS", files: statuses,
}, null, 2) + "\n");
if (problem) process.exitCode = 1;
