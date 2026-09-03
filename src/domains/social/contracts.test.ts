import { describe, expect, it } from "vitest";
import * as socialContracts from "./contracts";

describe("social contracts", () => {
  it("can be imported as a module", () => {
    expect(socialContracts).toBeDefined();
  });
});
