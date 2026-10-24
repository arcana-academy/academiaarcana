import { createHash, timingSafeEqual } from "node:crypto";

export const PRIVATE_PREVIEW_USER = "arcana-preview";

/**
 * Fail-closed HTTP Basic gate for the isolated preview candidate only.
 * Missing/invalid credentials must never grant access when the gate is enabled.
 */
export function isPrivatePreviewEnabled(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return environment.AA_PRIVATE_PREVIEW !== "disabled";
}

export function isPrivatePreviewAuthorized(
  authorization: string | null,
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  const password = environment.AA_PRIVATE_PREVIEW_PASSWORD;
  // A high-entropy, preview-only secret is mandatory. Never accept a short key.
  if (!password || Buffer.byteLength(password, "utf8") < 32) return false;
  if (!authorization || authorization.length > 4096) return false;

  const match = /^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(authorization);
  if (!match) return false;
  const encoded = match[1];
  const raw = Buffer.from(encoded, "base64");
  if (!raw.length || raw.length > 2048) return false;
  // Reject non-canonical encodings instead of tolerating ambiguous Base64.
  if (raw.toString("base64") !== encoded) return false;
  const credentials = raw.toString("utf8");
  const separator = credentials.indexOf(":");
  if (separator < 0) return false;

  const user = credentials.slice(0, separator);
  const submittedPassword = credentials.slice(separator + 1);
  const actual = createHash("sha256")
    .update(user)
    .update("\0")
    .update(submittedPassword)
    .digest();
  const expected = createHash("sha256")
    .update(PRIVATE_PREVIEW_USER)
    .update("\0")
    .update(password)
    .digest();
  return timingSafeEqual(actual, expected);
}
