export function createContentSecurityPolicy(nonce: string): string {
  return [
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
    "connect-src 'self' https: wss:",
    "frame-src 'self' https:",
    "media-src 'self' data: blob: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}
