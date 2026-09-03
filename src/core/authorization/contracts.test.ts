import { describe, expect, it } from "vitest";
import { evaluateAuthorization } from "./contracts";
import type {
  AccessDecision,
  AccessRequest,
  AuthorizationPolicy,
} from "./contracts";

describe("authorization contracts", () => {
  const request: AccessRequest = {
    actorId: "user-1",
    action: "read",
    resourceId: "resource-1",
    contextId: "personal",
    purpose: "study",
  };

  it("models an explicit request without personal profile fields", () => {
    expect(request).toEqual({
      actorId: "user-1",
      action: "read",
      resourceId: "resource-1",
      contextId: "personal",
      purpose: "study",
    });
  });

  it("denies when no authorization policy is applicable", () => {
    const result = evaluateAuthorization(request, undefined);

    expect(result).toEqual({
      allowed: false,
      reason: "policy-denied",
    });
  });

  it("allows only when the supplied policy explicitly allows", () => {
    const policy: AuthorizationPolicy = () => ({
      allowed: true,
      scope: "self",
    });

    const result = evaluateAuthorization(request, policy);

    expect(result).toEqual({
      allowed: true,
      scope: "self",
    });
  });

  it("preserves an explicit denial from the applicable policy", () => {
    const policy: AuthorizationPolicy = () => ({
      allowed: false,
      reason: "wrong-context",
    });

    const result: AccessDecision = evaluateAuthorization(request, policy);

    expect(result).toEqual({
      allowed: false,
      reason: "wrong-context",
    });
  });
});