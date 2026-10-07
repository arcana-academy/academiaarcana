import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vitest";

const ASSET_ROOT = join(process.cwd(), "public/assets");

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

describe("visual asset governance", () => {
  test("asset metadata does not reuse the AA-VIS decision namespace", () => {
    const violations = walkMarkdown(ASSET_ROOT)
      .filter((path) => path !== join(ASSET_ROOT, "README.md"))
      .filter((path) => /^# AA-VIS-\d+/m.test(readFileSync(path, "utf8")))
      .map((path) => relative(process.cwd(), path));

    expect(violations).toEqual([]);
  });

  test("registered AA-ASSET identifiers are unique", () => {
    const seen = new Map<string, string>();
    const duplicates: Array<{ id: string; first: string; duplicate: string }> = [];

    for (const path of walkMarkdown(ASSET_ROOT)) {
      const content = readFileSync(path, "utf8");
      const match = content.match(/^# (AA-ASSET-\d{3})\b/m);
      if (!match?.[1]) continue;

      const current = relative(process.cwd(), path);
      const previous = seen.get(match[1]);

      if (previous) {
        duplicates.push({ id: match[1], first: previous, duplicate: current });
      } else {
        seen.set(match[1], current);
      }
    }

    expect(duplicates).toEqual([]);
  });
});
