export type AppErrorKind =
  | "validation"
  | "authentication"
  | "authorization"
  | "not-found"
  | "conflict"
  | "configuration"
  | "internal";

export type AppError = {
  readonly code: string;
  readonly kind: AppErrorKind;
  readonly message: string;
  readonly cause?: unknown;
};
