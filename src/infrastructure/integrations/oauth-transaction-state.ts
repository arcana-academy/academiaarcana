import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const OAUTH_STATE_VERSION = "v1";
const NONCE_BYTES = 32;

function signOAuthState(subjectId: string, nonce: string, secret: string): Buffer {
  return createHmac("sha256", secret)
    .update(OAUTH_STATE_VERSION)
    .update("\0")
    .update(subjectId)
    .update("\0")
    .update(nonce)
    .digest();
}

export function createSubjectBoundOAuthState(
  subjectId: string,
  secret: string,
): string {
  const normalizedSubjectId = subjectId.trim();
  const normalizedSecret = secret.trim();

  if (!normalizedSubjectId || !normalizedSecret) {
    throw new Error("OAuth state requires an authenticated subject and server secret.");
  }

  const nonce = randomBytes(NONCE_BYTES).toString("base64url");
  const signature = signOAuthState(
    normalizedSubjectId,
    nonce,
    normalizedSecret,
  ).toString("base64url");

  return `${OAUTH_STATE_VERSION}.${nonce}.${signature}`;
}

export function verifySubjectBoundOAuthState(
  state: string,
  subjectId: string,
  secret: string,
): boolean {
  const normalizedSubjectId = subjectId.trim();
  const normalizedSecret = secret.trim();

  if (!state || !normalizedSubjectId || !normalizedSecret) return false;

  const [version, nonce, signature, extra] = state.split(".");
  if (
    version !== OAUTH_STATE_VERSION ||
    !nonce ||
    !signature ||
    extra !== undefined
  ) {
    return false;
  }

  let received: Buffer;
  try {
    received = Buffer.from(signature, "base64url");
  } catch {
    return false;
  }

  const expected = signOAuthState(
    normalizedSubjectId,
    nonce,
    normalizedSecret,
  );

  return received.length === expected.length && timingSafeEqual(received, expected);
}
