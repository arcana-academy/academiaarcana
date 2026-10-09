/** Install exact approved Flonts files from an offline directory.
 * Read-only by default. --apply explicitly copies after SHA-256 validation.
 * Usage: node scripts/install-flonts-assets.mjs SOURCE_DIR [--apply]
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve, sep } from "node:path";

const sourceArg = process.argv[2];
const apply = process.argv.includes("--apply");
if (!sourceArg || sourceArg.startsWith("--")) {
  process.stderr.write("Usage: node scripts/install-flonts-assets.mjs SOURCE_DIR [--apply]\n");
  process.exit(2);
}
const sourceDir = resolve(sourceArg);
const manifest = JSON.parse(readFileSync(resolve("docs/visual/FLONTS-VISUAL-LOCK.json"), "utf8"));
const targetDir = resolve(manifest.root);
if (manifest.asset_id !== "AA-ASSET-013" || manifest.files.length !== 5) {
  throw new Error("Invalid canonical Flonts manifest");
}
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const results = [];
let invalid = false;
for (const file of manifest.files) {
  const name = file.filename;
  if (typeof name !== "string" || basename(name) !== name || !/^flonts-mago-[a-z0-9-]+\.(png|webp)$/.test(name)) {
    invalid = true;
    results.push({ name, status: "INVALID_NAME" });
    continue;
  }
  const source = resolve(sourceDir, name);
  const target = resolve(targetDir, name);
  if (!source.startsWith(sourceDir + sep) || !target.startsWith(targetDir + sep)) {
    invalid = true;
    results.push({ name, status: "UNSAFE_PATH" });
    continue;
  }
  if (!existsSync(source)) {
    invalid = true;
    results.push({ name, status: "SOURCE_MISSING" });
    continue;
  }
  const bytes = readFileSync(source);
  if (statSync(source).size !== file.bytes || bytes.length !== file.bytes || digest(bytes) !== file.sha256) {
    invalid = true;
    results.push({ name, status: "SOURCE_MISMATCH" });
    continue;
  }
  if (existsSync(target) && digest(readFileSync(target)) !== file.sha256) {
    invalid = true;
    results.push({ name, status: "TARGET_CONFLICT" });
    continue;
  }
  results.push({ name, status: existsSync(target) ? "ALREADY_VALID" : "READY" });
}
if (!invalid && apply) {
  mkdirSync(targetDir, { recursive: true });
  for (const item of results) {
    if (item.status !== "READY") continue;
    copyFileSync(join(sourceDir, item.name), join(targetDir, item.name));
    item.status = "COPIED";
  }
}
process.stdout.write(JSON.stringify({ assetId: manifest.asset_id, apply, valid: !invalid, files: results }, null, 2) + "\n");
if (invalid) process.exitCode = 1;
