import { describe, expect, it } from "vitest";

import { mergeAccessibilityPreferences } from "./PreferencesMerge";

describe("PreferencesMerge", () => {
  it("usa o valor do perfil quando ele já existe", () => {
    expect(
      mergeAccessibilityPreferences(
        {
          motion: "reduced",
        },
        {
          motion: "normal",
        },
      ),
    ).toEqual({
      motion: "reduced",
    });
  });

  it("usa o valor local quando o perfil não possui preferência", () => {
    expect(
      mergeAccessibilityPreferences(null, {
        motion: "reduced",
      }),
    ).toEqual({
      motion: "reduced",
    });
  });

  it("usa system quando não existe preferência local nem de perfil", () => {
    expect(mergeAccessibilityPreferences(null, null)).toEqual({
      motion: "system",
    });
  });

  it("não permite que o valor local sobrescreva o perfil", () => {
    expect(
      mergeAccessibilityPreferences(
        {
          motion: "normal",
        },
        {
          motion: "reduced",
        },
      ),
    ).toEqual({
      motion: "normal",
    });
  });
});
