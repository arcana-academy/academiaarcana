import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vitest";

const ASSET_ROOT = join(process.cwd(), "public/assets");
const ASSET_README = join(ASSET_ROOT, "README.md");

type AssetRecord = {
  id: string;
  content: string;
};

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

function declaredAssetRecords(content: string): AssetRecord[] {
  const heading = content.match(/^# (AA-ASSET-\d{3})\b/m);
  if (heading?.[1]) {
    return [{ id: heading[1], content }];
  }

  const declarations = [
    ...content.matchAll(/^- \*\*(AA-ASSET-\d{3})\*\* —.*$/gm),
  ];

  return declarations.map((match, index) => {
    const start = match.index ?? 0;
    const nextDeclaration = declarations[index + 1]?.index ?? content.length;
    const nextSection = content.indexOf("\n## ", start + 1);
    const end =
      nextSection !== -1 && nextSection < nextDeclaration
        ? nextSection
        : nextDeclaration;

    return {
      id: match[1],
      content: content.slice(start, end),
    };
  });
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

      for (const record of declaredAssetRecords(content)) {
        const previous = seen.get(record.id);
        if (previous) {
          duplicates.push({ id: record.id, first: previous, duplicate: current });
        } else {
          seen.set(record.id, current);
        }
      }
    }

    expect(duplicates).toEqual([]);
  });

  test("asset metadata requires at least one valid AA-ASSET declaration", () => {
    const violations = metadataFiles()
      .filter(
        (path) =>
          declaredAssetRecords(readFileSync(path, "utf8")).length === 0,
      )
      .map((path) => relative(process.cwd(), path));

    expect(violations).toEqual([]);
  });

  test("every declared asset record exposes the Phase 2 minimum governance fields", () => {
    const violations: Array<{
      path: string;
      id: string;
      missing: string[];
    }> = [];
    const required = [
      "Graphic role",
      "Consumer status",
      "Theme behavior",
      "Originality/source status",
    ];

    for (const path of metadataFiles()) {
      const content = readFileSync(path, "utf8");

      for (const record of declaredAssetRecords(content)) {
        const missing = required.filter(
          (field) => !record.content.includes(field),
        );

        if (missing.length > 0) {
          violations.push({
            path: relative(process.cwd(), path),
            id: record.id,
            missing,
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
