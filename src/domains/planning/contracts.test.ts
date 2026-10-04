import { describe, expect, it } from "vitest";
import * as planningContracts from "./contracts";

describe("planning contracts", () => {
  it("can be imported as a module", () => {
    expect(planningContracts).toBeDefined();
  });
});
