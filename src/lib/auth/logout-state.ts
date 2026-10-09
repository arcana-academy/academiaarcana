export type LogoutStatus =
  | "idle"
  | "revocation_failed"
  | "outcome_unknown"
  | "reauth_required"
  | "cleanup_incomplete"
  | "unexpected_error";

export type LogoutActionState = {
  status: LogoutStatus;
};

export const INITIAL_LOGOUT_STATE: LogoutActionState = { status: "idle" };
