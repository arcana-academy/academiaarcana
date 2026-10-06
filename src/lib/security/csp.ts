export function createContentSecurityPolicy(
  nonce: string,
  environment = process.env.NODE_ENV,
): string {
  const isDevelopment = environment === "development";

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    isDevelopment
      ? "style-src 'self' 'unsafe-inline' https://use.typekit.net"
      : `style-src 'self' 'nonce-${nonce}' https://use.typekit.net`,
    "script-src-attr 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://use.typekit.net",
    isDevelopment
      ? "connect-src 'self' https: wss: http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*"
      : "connect-src 'self' https: wss:",
    "frame-src 'self' https:",
    "media-src 'self' data: blob: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];

  if (!isDevelopment) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}
