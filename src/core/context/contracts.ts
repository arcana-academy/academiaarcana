export type ContextVisibility = "private" | "explicit-share";

export type ContextResource = {
  resourceId: string;
  ownerId: string;
  contextId: string;
  visibility: ContextVisibility;
};

/**
 * Resources are private by default at the contract level.
 * Sharing is represented explicitly and must be paired with authorization.
 */
export const DEFAULT_CONTEXT_VISIBILITY: ContextVisibility = "private";
