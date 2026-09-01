import { describe, expect, it } from "vitest";
import type { AccessDecision, AccessRequest, AuthorizationPolicy } from "./contracts";

describe("authorization contracts", () => {
  it("models an explicit request without personal profile fields", () => {
    const request: AccessRequest = {
      actorId: "user-1",
      action: "read",
      resourceId: "resource-1",
      contextId: "personal",
      purpose: "study",
    };

    expect(request).toEqual({
      actorId: "user-1",
      action: "read",
      resourceId: "resource-1",
      contextId: "personal",
      purpose: "study",
    });
  });

  it("requires an explicit decision with a bounded allow scope", () => {
    const policy: AuthorizationPolicy = () => ({
      allowed: true,
      scope: "self",
    });

    const denied: AccessDecision = { allowed: false, reason: "policy-denied" };

    expect(policy()).toEqual({
      allowed: true,
      scope: "self",
    });
    expect(denied.allowed).toBe(false);
  });
});
