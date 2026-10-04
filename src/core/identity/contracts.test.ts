import { describe, expect, it } from "vitest";
import type { Identity, IdentityStatus } from "./contracts";

describe("identity contracts", () => {
  it("represents identity separately from profile data and permissions", () => {
    const identity: Identity = {
      subjectId: "user-1",
      status: "active",
    };

    expect(identity).toEqual({ subjectId: "user-1", status: "active" });
  });

  it("limits identity status to lifecycle states", () => {
    const statuses: IdentityStatus[] = ["active", "suspended", "deactivated"];

    expect(statuses).toEqual(["active", "suspended", "deactivated"]);
  });
});
