import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vitest";

const SRC = join(process.cwd(), "src");
const LEGACY_VARIABLES = [
  "--aa-motion-duration",
  "--aa-line-subtle",
  "--aa-line-highlight",
  "--aa-ink-deep",
  "--aa-ink-soft",
  "--aa-surface-glass",
  "--aa-surface-glow",
  "--aa-accent-violet",
  "--aa-accent-violet-strong",
  "--aa-accent-gold",
  "--aa-accent-gold-soft",
  "--aa-shadow-arcane",
];

function walkCss(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walkCss(path);
    return entry.isFile() && entry.name.endsWith(".css") ? [path] : [];
  });
}

describe("visual consumer convergence", () => {
  test("legacy visual variables are absent from every CSS consumer", () => {
    for (const path of walkCss(SRC)) {
      const css = readFileSync(path, "utf8");
      for (const legacyVariable of LEGACY_VARIABLES) {
        expect(css, `${relative(SRC, path)} contains ${legacyVariable}`).not.toContain(legacyVariable);
      }
    }
  });

  test("CSS Modules consume semantic variables instead of defining physical color systems", () => {
    const physicalColor = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i;
    for (const path of walkCss(SRC).filter((path) => path.endsWith(".module.css"))) {
      const css = readFileSync(path, "utf8");
      expect(css, `${relative(SRC, path)} contains a physical color literal`).not.toMatch(physicalColor);
    }
  });

  test("globals no longer hard-codes the recurring arcane accent channels", () => {
    const css = readFileSync(join(SRC, "app/globals.css"), "utf8");
    for (const channel of ["155 120 208", "200 168 106", "185 164 207"]) {
      expect(css).not.toContain(channel);
    }
  });

  test("the obsolete landing stylesheet is removed", () => {
    expect(existsSync(join(SRC, "app/ArcanaLanding.module.css"))).toBe(false);
  });

  test("the generated landing uses the canonical 16/20/24 icon scale", () => {
    const source = readFileSync(
      join(SRC, "components/generated/AcademiaArcanaLanding.generated.tsx"),
      "utf8",
    );
    const sizes = [...source.matchAll(/size=\{(\d+)\}/g)].map((match) => Number(match[1]));
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.every((size) => [16, 20, 24].includes(size))).toBe(true);
  });
});
