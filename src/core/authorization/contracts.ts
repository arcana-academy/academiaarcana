export type AccessAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "share"
  | "export"
  | "execute";

export type AccessDecision =
  | {
      allowed: true;
      scope: "self" | "context" | "explicit-share";
    }
  | {
      allowed: false;
      reason:
        | "unauthenticated"
        | "missing-permission"
        | "wrong-context"
        | "not-explicitly-shared"
        | "policy-denied";
    };

export type AccessRequest = {
  actorId: string;
  action: AccessAction;
  resourceId: string;
  contextId?: string;
  purpose?: string;
};

/**
 * Authorization is an explicit boundary. Callers must provide the request
 * context and consume an explicit decision; there is no implicit allow.
 */
export type AuthorizationPolicy = (request: AccessRequest) => AccessDecision;

/**
 * Evaluates an authorization request against a policy.
 * Returns a denial with reason "policy-denied" when no policy is provided.
 */
export function evaluateAuthorization(
  request: AccessRequest,
  policy: AuthorizationPolicy | undefined,
): AccessDecision {
  if (!policy) {
    return {
      allowed: false,
      reason: "policy-denied",
    };
  }

  return policy(request);
}
