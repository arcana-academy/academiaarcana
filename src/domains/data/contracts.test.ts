import { describe, expect, it } from "vitest";
import * as dataContracts from "./contracts";

describe("data contracts", () => {
  it("can be imported as a module", () => {
    expect(dataContracts).toBeDefined();
  });
});
