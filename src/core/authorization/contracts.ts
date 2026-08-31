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
export type AuthorizationPolicy = (
  request: AccessRequest,
) => AccessDecision;
