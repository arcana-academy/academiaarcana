export type IdentityStatus = "active" | "suspended" | "deactivated";

/**
 * Stable identity reference only.
 * Profile data, context membership and permissions belong to their own domains.
 */
export type Identity = {
  subjectId: string;
  status: IdentityStatus;
};
