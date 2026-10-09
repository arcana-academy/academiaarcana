import { describe, expect, it } from "vitest";
import { PORTAL_PREVIEW_IDS, portalPreviews } from "./catalog";

describe("portal visual architecture candidates", () => {
  it("provides a distinct proposed navigation for each requested role", () => {
    expect(new Set(PORTAL_PREVIEW_IDS).size).toBe(4);
    for (const id of PORTAL_PREVIEW_IDS) {
      const entry = portalPreviews[id];
      expect(entry.id).toBe(id);
      expect(entry.sections.length).toBeGreaterThan(3);
      expect(new Set(entry.sections).size).toBe(entry.sections.length);
      expect(entry.note).toMatch(/autoriza|permiss|contrato|vínculo/i);
    }
  });
});
