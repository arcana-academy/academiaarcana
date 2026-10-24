/**
 * Treat URLs returned by provider APIs as untrusted navigation input. Keep
 * integration links functional for standard HTTPS URLs while excluding script,
 * data, credential-bearing and relative URLs.
 */
export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}
