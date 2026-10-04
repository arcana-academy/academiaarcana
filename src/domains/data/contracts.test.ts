import { describe, expect, it } from "vitest";
import * as dataContracts from "./contracts";

describe("data contracts", () => {
  it("can be imported as a module", () => {
    expect(dataContracts).toBeDefined();
  });

  it("exposes persistence identity and record metadata contracts", () => {
    const id = dataContracts.createPersistenceId("550e8400-e29b-41d4-a716-446655440000");
    const metadata: dataContracts.PersistenceMetadata = {
      id,
      createdAt: "2026-09-10T00:00:00.000Z",
      updatedAt: "2026-09-10T00:00:00.000Z",
      version: 1,
    };

    expect(metadata.id).toBe(id);
    expect(metadata.version).toBe(1);
  });

  it("rejects invalid persistence identifiers", () => {
    expect(() => dataContracts.createPersistenceId("not-a-uuid")).toThrow(
      "Invalid persistence identifier",
    );
  });
});
