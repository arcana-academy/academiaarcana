import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("sidebar responsive style contract", () => {
  it("allows navigation destinations to remain reachable on short viewports", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const sidebarRule = css.match(/\.aa-sidebar\s*\{([^}]+)\}/)?.[1];

    expect(sidebarRule).toBeDefined();
    expect(sidebarRule).toMatch(/overflow-y:\s*auto\s*;/);
    expect(sidebarRule).toMatch(/overscroll-behavior-y:\s*contain\s*;/);
  });
});
