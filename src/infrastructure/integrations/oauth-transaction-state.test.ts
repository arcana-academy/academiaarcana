import { describe, expect, it } from "vitest";

import {
  createSubjectBoundOAuthState,
  verifySubjectBoundOAuthState,
} from "./oauth-transaction-state";

describe("OAuth transaction state", () => {
  it("binds the state to the authenticated subject", () => {
    const state = createSubjectBoundOAuthState("user-a", "server-secret");

    expect(
      verifySubjectBoundOAuthState(state, "user-a", "server-secret"),
    ).toBe(true);
    expect(
      verifySubjectBoundOAuthState(state, "user-b", "server-secret"),
    ).toBe(false);
  });

  it("rejects state signed with another server secret", () => {
    const state = createSubjectBoundOAuthState("user-a", "secret-a");

    expect(
      verifySubjectBoundOAuthState(state, "user-a", "secret-b"),
    ).toBe(false);
  });

  it("rejects malformed or tampered state", () => {
    const state = createSubjectBoundOAuthState("user-a", "server-secret");
    const tampered = state.replace(/.$/, (value) => (value === "A" ? "B" : "A"));

    expect(
      verifySubjectBoundOAuthState(tampered, "user-a", "server-secret"),
    ).toBe(false);
    expect(
      verifySubjectBoundOAuthState("invalid", "user-a", "server-secret"),
    ).toBe(false);
  });

  it("generates a distinct nonce for each authorization transaction", () => {
    const first = createSubjectBoundOAuthState("user-a", "server-secret");
    const second = createSubjectBoundOAuthState("user-a", "server-secret");

    expect(first).not.toBe(second);
  });
});
