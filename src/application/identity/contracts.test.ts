import { describe, expect, it } from "vitest";

import type {
  ApplicationIdentityState,
  ApplicationIdentityStatus,
} from "./contracts";

describe("application identity contracts", () => {
  it("define os estados de resolução da identidade", () => {
    const statuses: ApplicationIdentityStatus[] = [
      "loading",
      "authenticated",
      "anonymous",
    ];

    expect(statuses).toEqual([
      "loading",
      "authenticated",
      "anonymous",
    ]);
  });

  it("representa uma identidade autenticada", () => {
    const state: ApplicationIdentityState = {
      status: "authenticated",
      identity: {
        subjectId: "user-123",
        status: "active",
      },
      error: null,
    };

    expect(state.status).toBe("authenticated");
    expect(state.identity?.subjectId).toBe("user-123");
    expect(state.identity?.status).toBe("active");
    expect(state.error).toBeNull();
  });

  it("representa estado anônimo sem identidade", () => {
    const state: ApplicationIdentityState = {
      status: "anonymous",
      identity: null,
      error: null,
    };

    expect(state.status).toBe("anonymous");
    expect(state.identity).toBeNull();
    expect(state.error).toBeNull();
  });
});
