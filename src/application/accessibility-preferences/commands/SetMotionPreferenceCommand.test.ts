import { describe, expect, it } from "vitest";

import {
  SetMotionPreferenceCommand,
} from "./SetMotionPreferenceCommand";

describe("SetMotionPreferenceCommand", () => {
  it("deve retornar a preferência de movimento configurada", () => {
    const result = SetMotionPreferenceCommand.execute({
      preference: "reduced",
    });

    expect(result).toEqual({
      configuredMotionPreference: "reduced",
    });
  });
});
