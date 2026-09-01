import { describe, expect, it } from "vitest";
import { err, ok } from "./result";

describe("Result", () => {
  it("represents success without throwing", () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });

  it("represents failure with a typed application error", () => {
    const error = {
      code: "NOT_FOUND",
      kind: "not-found" as const,
      message: "Missing resource",
    };

    expect(err(error)).toEqual({ ok: false, error });
  });
});
