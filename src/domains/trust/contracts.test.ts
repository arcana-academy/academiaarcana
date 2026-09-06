import { describe, expect, it } from "vitest";
import * as trustContracts from "./contracts";

describe("trust contracts", () => {
  it("can be imported as a module", () => {
    expect(trustContracts).toBeDefined();
  });
});
