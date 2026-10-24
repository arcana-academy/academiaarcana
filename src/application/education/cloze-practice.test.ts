import { describe, expect, it } from "vitest";
import {
  buildClozeParts,
  reconstructCloze,
  MAX_CLOZE_GAPS_PER_BLOCK,
} from "./cloze-practice";

describe("buildClozeParts", () => {
  it("keeps exact saved text including punctuation, Unicode, accents and spaces", () => {
    const source = "Fotossíntese converte energia luminosa em química. Fotossíntese!";
    const parts = buildClozeParts(source);
    expect(parts.filter((part) => part.kind === "gap")).toEqual([
      { kind: "gap", answer: "Fotossíntese", number: 1 },
      { kind: "gap", answer: "converte", number: 2 },
      { kind: "gap", answer: "energia", number: 3 },
    ]);
    expect(reconstructCloze(parts)).toBe(source);
  });

  it("limits unique gaps and does not invent words or inferred correct answers", () => {
    const source = "luminosa LUMINOSA partículas moléculas energia biologia";
    const parts = buildClozeParts(source);
    expect(parts.filter((part) => part.kind === "gap")).toHaveLength(MAX_CLOZE_GAPS_PER_BLOCK);
    expect(reconstructCloze(parts)).toBe(source);
    expect(parts.filter((part) => part.kind === "gap").map((part) => part.answer)).toEqual([
      "luminosa", "partículas", "moléculas",
    ]);
  });

  it("supports a legitimate empty or short-only passage without fabricating blanks", () => {
    expect(buildClozeParts(" \n ")).toEqual([]);
    expect(buildClozeParts("Sol e mar.")).toEqual([{ kind: "text", text: "Sol e mar." }]);
    expect(reconstructCloze(buildClozeParts("Sol e mar."))).toBe("Sol e mar.");
  });

  it("does not interpret user-owned source text as executable markup", () => {
    const source = '<script>alert("segredo")</script>';
    expect(reconstructCloze(buildClozeParts(source))).toBe(source);
  });
});
