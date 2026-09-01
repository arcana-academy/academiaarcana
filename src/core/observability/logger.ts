const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "password",
  "secret",
  "token",
  "apiKey",
  "api_key",
  "serviceRoleKey",
  "service_role_key",
  "anonKey",
  "anon_key",
]);

export type LogMetadata = Record<string, unknown>;

export type LoggerSink = {
  debug(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;
};

export type Logger = LoggerSink;

function redact(metadata?: LogMetadata): LogMetadata | undefined {
  if (!metadata) return undefined;

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      SENSITIVE_KEYS.has(key) ? "[REDACTED]" : value,
    ]),
  );
}

export function createLogger(sink: LoggerSink = console): Logger {
  const emit = (level: keyof LoggerSink, message: string, metadata?: LogMetadata) => {
    const safeMetadata = redact(metadata);
    if (safeMetadata && Object.keys(safeMetadata).length > 0) {
      sink[level](message, safeMetadata);
      return;
    }
    sink[level](message);
  };

  return {
    debug: (message, metadata) => emit("debug", message, metadata),
    info: (message, metadata) => emit("info", message, metadata),
    warn: (message, metadata) => emit("warn", message, metadata),
    error: (message, metadata) => emit("error", message, metadata),
  };
}

export const logger = createLogger();
