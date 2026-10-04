import { describe, expect, it } from "vitest";
import type {
  FlontsActions,
  FlontsMode,
  FlontsMotionPreference,
  FlontsState,
  FlontsVisibility,
} from "./contracts";

describe("flonts contracts", () => {
  it("defines the only supported mode", () => {
    const mode: FlontsMode = "idle";

    expect(mode).toBe("idle");
  });

  it("defines the supported visibility states", () => {
    const visible: FlontsVisibility = "visible";
    const hidden: FlontsVisibility = "hidden";

    expect([visible, hidden]).toEqual(["visible", "hidden"]);
  });

  it("defines the supported motion preferences", () => {
    const normal: FlontsMotionPreference = "normal";
    const reduced: FlontsMotionPreference = "reduced";

    expect([normal, reduced]).toEqual(["normal", "reduced"]);
  });

  it("defines the public Flonts state", () => {
    const state: FlontsState = {
      mode: "idle",
      visibility: "visible",
      motionPreference: "normal",
      message: null,
    };

    expect(state).toEqual({
      mode: "idle",
      visibility: "visible",
      motionPreference: "normal",
      message: null,
    });
  });

  it("defines the public Flonts actions", () => {
    const actions: FlontsActions = {
      show: () => undefined,
      hide: () => undefined,
      setMode: () => undefined,
      setMessage: () => undefined,
    };

    expect(actions).toBeDefined();
  });
});
