import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vitest";

const ASSET_ROOT = join(process.cwd(), "public/assets");
const ASSET_README = join(ASSET_ROOT, "README.md");

function walkMarkdown(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory()
      ? walkMarkdown(path)
      : name.endsWith(".md")
        ? [path]
        : [];
  });
}

function metadataFiles(): string[] {
  return walkMarkdown(ASSET_ROOT).filter((path) => path !== ASSET_README);
}

describe("visual asset governance", () => {
  test("asset metadata does not reuse the AA-VIS decision namespace", () => {
    const violations = metadataFiles()
      .filter((path) => /\bAA-VIS-[A-Z0-9-]+\b/.test(readFileSync(path, "utf8")))
      .map((path) => relative(process.cwd(), path));

    expect(violations).toEqual([]);
  });

  test("registered AA-ASSET identifiers are unique across metadata files", () => {
    const seen = new Map<string, string>();
    const duplicates: Array<{ id: string; first: string; duplicate: string }> = [];

    for (const path of metadataFiles()) {
      const content = readFileSync(path, "utf8");
      const ids = new Set(content.match(/\bAA-ASSET-\d{3}\b/g) ?? []);
      const current = relative(process.cwd(), path);

      for (const id of ids) {
        const previous = seen.get(id);
        if (previous) {
          duplicates.push({ id, first: previous, duplicate: current });
        } else {
          seen.set(id, current);
        }
      }
    }

    expect(duplicates).toEqual([]);
  });

  test("registered asset metadata exposes the Phase 2 governance fields", () => {
    const violations: Array<{ path: string; missing: string[] }> = [];

    for (const path of metadataFiles()) {
      const content = readFileSync(path, "utf8");
      if (!/\bAA-ASSET-\d{3}\b/.test(content)) continue;

      const required = [
        "Graphic role",
        "Consumer status",
        "Theme behavior",
        "Originality/source status",
      ];
      const missing = required.filter((field) => !content.includes(field));

      if (missing.length > 0) {
        violations.push({ path: relative(process.cwd(), path), missing });
      }
    }

    expect(violations).toEqual([]);
  });
});
