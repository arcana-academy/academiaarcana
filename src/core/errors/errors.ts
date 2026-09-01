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

export class ConfigurationError extends Error {
  readonly code = "CONFIG_MISSING" as const;
  readonly kind = "configuration" as const;

  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}
