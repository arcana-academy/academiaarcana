import { describe, expect, it } from "vitest";
import * as educationContracts from "./contracts";

describe("education contracts", () => {
  it("can be imported as a module", () => {
    expect(educationContracts).toBeDefined();
  });
});
