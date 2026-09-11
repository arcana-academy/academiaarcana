import { describe, expect, it } from "vitest";

import {
  GetAccessibilityPreferencesQuery,
} from "./GetAccessibilityPreferencesQuery";

describe("GetAccessibilityPreferencesQuery", () => {
  it("deve retornar as preferências de acessibilidade configuradas", () => {
    const result = GetAccessibilityPreferencesQuery.execute();

    expect(result).toEqual({
      preferences: {
        motion: "normal",
      },
    });
  });
});
