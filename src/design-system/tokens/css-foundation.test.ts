import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { baseTokens } from "./base";

function toCssName(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
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
  test("keeps the SSR/static CSS fallback synchronized with base tokens", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    for (const [variable, value] of flatten(baseTokens)) {
      expect(css, `${variable} = ${value}`).toContain(`${variable}: ${value}`);
    }
  });
});
