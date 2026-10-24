import { describe, expect, it } from "vitest";

import {
  MESTRE_ARCANO_HELP_LEVELS,
  resolveMestreArcanoHelpLevel,
} from "./contracts";

describe("intelligence contracts", () => {
  it("uses unspecified when the Mestre Arcano request omits a help level", () => {
    expect(resolveMestreArcanoHelpLevel(undefined)).toBe("unspecified");
  });

  it.each(MESTRE_ARCANO_HELP_LEVELS)(
    "accepts the supported help level %s",
    (helpLevel) => {
      expect(resolveMestreArcanoHelpLevel(helpLevel)).toBe(helpLevel);
    },
  );

  it("rejects unsupported help levels instead of guessing learner intent", () => {
    expect(resolveMestreArcanoHelpLevel("full-solution")).toBeNull();
    expect(resolveMestreArcanoHelpLevel(1)).toBeNull();
  });
});
