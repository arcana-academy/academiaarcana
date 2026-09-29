import { describe, expect, it, vi } from "vitest";

import { executeMestreArcano } from "./execute-mestre-arcano";

describe("executeMestreArcano", () => {
  it("normalizes input before delegating to the gateway", async () => {
    const execute = vi.fn().mockResolvedValue({
      output: "ok",
      responseId: "resp_1",
      model: "gpt-5.6-sol",
    });

    const result = await executeMestreArcano({ execute }, "  Olá, Mestre.  ");

    expect(execute).toHaveBeenCalledWith("Olá, Mestre.");
    expect(result.output).toBe("ok");
  });

  it("rejects blank requests before reaching infrastructure", async () => {
    const execute = vi.fn();

    await expect(executeMestreArcano({ execute }, "   ")).rejects.toThrow(
      "Mestre Arcano requires a non-empty input.",
    );
    expect(execute).not.toHaveBeenCalled();
  });
});
