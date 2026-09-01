import { describe, expect, it } from "vitest";
import { createBackup, parseBackup } from "./backup";

describe("learning backup", () => {
  it("serializes and validates the backup envelope", () => {
    const backup = createBackup({ versions: [], pendingOperations: [], createdAt: "2026-09-01T12:00:00Z" });
    expect(parseBackup(JSON.stringify(backup))).toEqual(backup);
  });

  it("rejects unknown formats", () => {
    expect(() => parseBackup(JSON.stringify({ format: "other", version: 1 }))).toThrow("Formato de backup não reconhecido.");
  });
});
