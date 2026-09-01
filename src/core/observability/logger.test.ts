import { describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger";

describe("structured logger", () => {
  it("redacts sensitive metadata before emitting an error event", () => {
    const sink = { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() };
    const logger = createLogger(sink);

    logger.error("request failed", {
      requestId: "req-1",
      authorization: "Bearer secret",
      password: "secret-password",
      nested: { token: "secret-token" },
    });

    expect(sink.error).toHaveBeenCalledWith("request failed", {
      requestId: "req-1",
      authorization: "[REDACTED]",
      password: "[REDACTED]",
      nested: { token: "secret-token" },
    });
  });
});
