import { describe, expect, it } from "vitest";
import * as gamificationContracts from "./contracts";

describe("gamification contracts", () => {
  it("can be imported as a module", () => {
    expect(gamificationContracts).toBeDefined();
  });
});
