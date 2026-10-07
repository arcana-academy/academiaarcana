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

function declaredAssetIds(content: string): string[] {
  const headings = [...content.matchAll(/^# (AA-ASSET-\d{3})\b/gm)].map(
    (match) => match[1],
  );
  const records = [...content.matchAll(/^- \*\*(AA-ASSET-\d{3})\*\* —/gm)].map(
    (match) => match[1],
  );

  return [...headings, ...records];
}

function invalidDecisionNamespaceDeclarations(content: string): string[] {
  const headings = [...content.matchAll(/^# (AA-VIS-[A-Z0-9-]+)\b/gm)].map(
    (match) => match[1],
  );
  const records = [
    ...content.matchAll(/^- \*\*(AA-VIS-[A-Z0-9-]+)\*\* —/gm),
  ].map((match) => match[1]);

  return [...headings, ...records];
}

function looksLikeAssetMetadata(content: string): boolean {
  return (
    /^Status:/m.test(content) ||
    /^Category:/m.test(content) ||
    /^File:/m.test(content) ||
    /^Validation:/m.test(content)
  );
}

describe("visual asset governance", () => {
  test("asset identifier declarations do not reuse the AA-VIS decision namespace", () => {
    const violations = metadataFiles().flatMap((path) => {
      const content = readFileSync(path, "utf8");
      return invalidDecisionNamespaceDeclarations(content).map((id) => ({
        path: relative(process.cwd(), path),
        id,
      }));
    });

    expect(violations).toEqual([]);
  });

  test("registered AA-ASSET declarations are unique, including within one metadata file", () => {
    const seen = new Map<string, string>();
    const duplicates: Array<{ id: string; first: string; duplicate: string }> = [];

    for (const path of metadataFiles()) {
      const content = readFileSync(path, "utf8");
      const current = relative(process.cwd(), path);

      for (const id of declaredAssetIds(content)) {
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

  test("asset metadata requires at least one valid AA-ASSET declaration", () => {
    const violations = metadataFiles()
      .filter((path) => {
        const content = readFileSync(path, "utf8");
        return looksLikeAssetMetadata(content) && declaredAssetIds(content).length === 0;
      })
      .map((path) => relative(process.cwd(), path));

    expect(violations).toEqual([]);
  });

  test("registered asset metadata exposes the Phase 2 governance fields", () => {
    const violations: Array<{ path: string; missing: string[] }> = [];

    for (const path of metadataFiles()) {
      const content = readFileSync(path, "utf8");
      if (!looksLikeAssetMetadata(content)) continue;

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
