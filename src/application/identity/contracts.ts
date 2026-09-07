import type { Identity } from "@/core/identity";

export type ApplicationIdentityStatus =
  | "loading"
  | "authenticated"
  | "anonymous"
  | "error";

export type ApplicationIdentityError = {
  code: "IDENTITY_RESOLUTION_FAILED";
  message: string;
};

export type ApplicationIdentityState = {
  status: ApplicationIdentityStatus;
  identity: Identity | null;
  error: ApplicationIdentityError | null;
};
