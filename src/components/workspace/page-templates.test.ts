import { describe, expect, test } from "vitest";
import { buildStarterTemplate, canApplyStarterTemplate, PAGE_STARTER_TEMPLATES } from "./page-templates";

describe("Four approved non-destructive page starters", () => {
  test("builds the four approved editable layouts", () => {
    expect(PAGE_STARTER_TEMPLATES.map((x) => x.id)).toEqual(["blank", "notes", "experiment", "illustrated"]);
    expect(buildStarterTemplate("blank").blocks).toEqual([]);
    expect(buildStarterTemplate("notes").blocks).toHaveLength(4);
    expect(buildStarterTemplate("experiment").blocks).toHaveLength(6);
    expect(buildStarterTemplate("illustrated").blocks.map((x) => x.type)).toEqual(["paragraph", "image", "paragraph"]);
  });
  test("rejects any authored content and accessible descriptions", () => {
    expect(canApplyStarterTemplate({ type: "document", blocks: [] })).toBe(true);
    expect(canApplyStarterTemplate({ type: "document", blocks: [{ type: "paragraph", content: " " }] })).toBe(true);
    expect(canApplyStarterTemplate({ type: "document", blocks: [{ type: "paragraph", content: "Original" }] })).toBe(false);
    expect(canApplyStarterTemplate({ type: "document", blocks: [{ type: "paragraph", content: "", accessibility: { description: "Existing accessible content" } }] })).toBe(false);
  });
});
