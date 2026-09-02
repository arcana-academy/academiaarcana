import { describe, expect, it } from "vitest";
import * as learningContracts from "./contracts";

describe("learning contracts", () => {
  it("can be imported as a module", () => {
    expect(learningContracts).toBeDefined();
  });
});