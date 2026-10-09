import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "src");
const OWNER = "src/components/flonts/FlontsPortrait.tsx";

function componentFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const fullPath = join(directory, name);
    if (statSync(fullPath).isDirectory()) return componentFiles(fullPath);
    return fullPath.endsWith(".tsx") && !fullPath.endsWith(".test.tsx")
      ? [fullPath]
      : [];
  });
}

describe("Flonts fixed visual ownership", () => {
  it("resolves original artwork only through the shared approved portrait component", () => {
    const directReferences = componentFiles(ROOT).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const path = relative(process.cwd(), file).replaceAll("\\", "/");
      if (path === OWNER) return [];
      return /\/assets\/flonts\/|flonts-mago-(?:mini-96|320|480|960|original-aprovado)\.(?:webp|png)/.test(source)
        ? [path]
        : [];
    });
    expect(directReferences).toEqual([]);
  });
});
