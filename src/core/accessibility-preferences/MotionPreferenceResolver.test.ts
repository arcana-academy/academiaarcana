import { describe, expect, it } from "vitest";
import { resolveMotionPreference } from "./MotionPreferenceResolver";

describe("MotionPreferenceResolver", () => {
  it("retorna normal quando a preferência configurada é normal", () => {
    expect(
      resolveMotionPreference({
        configuredPreference: "normal",
        systemPreference: "reduced",
      }),
    ).toBe("normal");
  });

  it("retorna reduced quando a preferência configurada é reduced", () => {
    expect(
      resolveMotionPreference({
        configuredPreference: "reduced",
        systemPreference: "normal",
      }),
    ).toBe("reduced");
  });

  it("usa a preferência do sistema quando a configuração é system", () => {
    expect(
      resolveMotionPreference({
        configuredPreference: "system",
        systemPreference: "reduced",
      }),
    ).toBe("reduced");

    expect(
      resolveMotionPreference({
        configuredPreference: "system",
        systemPreference: "normal",
      }),
    ).toBe("normal");
  });
});
