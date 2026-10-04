import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { baseTokens } from "./base";

function toCssName(value: string): string {
  const normalized = value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
  return normalized === "breakpoints" ? "breakpoint" : normalized;
}

function flatten(value: unknown, prefix = ""): Array<[string, string]> {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}-${key}` : key;
    if (typeof child === "string") return [[`--aa-${path.split("-").map(toCssName).join("-")}`, child]];
    return flatten(child, path);
  });
}

describe("canonical CSS token fallback", () => {
  test("does not recreate a parallel visual token namespace", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    for (const legacyVariable of [
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
    ]) {
      expect(css).not.toContain(legacyVariable);
    }
  });
  test("keeps the SSR/static CSS fallback synchronized with base tokens", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    for (const [variable, value] of flatten(baseTokens)) {
      expect(css, `${variable} = ${value}`).toContain(`${variable}: ${value}`);
    }
  });
});
