import { describe, expect, it } from "vitest";
import { mergePreferences } from "./PreferencesMerge";

describe("PreferencesMerge", () => {
  it("usa a preferência autenticada quando ela existe", () => {
    expect(
      mergePreferences({
        local: {
          motionPreference: "normal",
        },
        authenticated: {
          motionPreference: "reduced",
        },
      }),
    ).toEqual({
      motionPreference: "reduced",
    });
  });

  it("usa a preferência local quando a autenticada está ausente", () => {
    expect(
      mergePreferences({
        local: {
          motionPreference: "reduced",
        },
        authenticated: {},
      }),
    ).toEqual({
      motionPreference: "reduced",
    });
  });

  it("usa system quando nenhuma preferência está disponível", () => {
    expect(
      mergePreferences({
        local: {},
        authenticated: {},
      }),
    ).toEqual({
      motionPreference: "system",
    });
  });

  it("ignora uma preferência autenticada inválida e preserva a preferência local válida", () => {
    expect(
      mergePreferences({
        local: {
          motionPreference: "reduced",
        },
        authenticated: {
          motionPreference: "invalid" as never,
        },
      }),
    ).toEqual({
      motionPreference: "reduced",
    });
  });
});