import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
const sidebar = readFileSync(
  join(root, "src/components/layout/Sidebar.tsx"),
  "utf8",
);

describe("authenticated sidebar responsive CSS contract", () => {
  it("styles the actual navigation list without default bullets or margins", () => {
    expect(sidebar).toContain('className="aa-sidebar-list"');
    expect(css).toMatch(
      /\.aa-sidebar-nav,\s*\.aa-sidebar-list\s*\{[^}]*display:\s*grid;[^}]*list-style:\s*none;[^}]*margin:\s*0;[^}]*padding:\s*0;/,
    );
  });

  it("keeps the persistent navigation scrollable at short viewport heights", () => {
    const sidebarRule = css.match(/\.aa-sidebar\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(sidebarRule).toContain("height: 100vh;");
    expect(sidebarRule).toContain("overflow-y: auto;");
  });

  it("keeps text labels usable at medium widths and mobile disclosure below 48rem", () => {
    const mediumRule = css.match(
      /@media \(max-width: 64rem\)\s*\{([\s\S]*?)\n\}\s*@media \(max-width: 48rem\)/,
    )?.[1] ?? "";
    expect(mediumRule).toContain("grid-template-columns: 13rem minmax(0, 1fr);");
    expect(css).toMatch(
      /@media \(max-width: 48rem\)\s*\{\s*\.aa-shell\s*\{\s*display:\s*block;/,
    );
  });
});
