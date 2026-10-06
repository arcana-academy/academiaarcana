export function createContentSecurityPolicy(
  nonce: string,
  environment = process.env,
): string {
  const allowLocalE2E =
    environment.CI === "true" && environment.E2E_LOCAL_RUNTIME === "1";

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}' https://use.typekit.net`,
    "script-src-attr 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://use.typekit.net",
    allowLocalE2E
      ? "connect-src 'self' https: wss: http://127.0.0.1:* http://localhost:*"
      : "connect-src 'self' https: wss:",
    "frame-src 'self' https:",
    "media-src 'self' data: blob: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];

  if (!allowLocalE2E) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}
