import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Public format label that prefixes every issued state value. It is sent in
// clear text as the first state segment, so it is not a credential.
const STATE_FORMAT_VERSION = "v1";
const NONCE_BYTES = 32;

function signOAuthState(subjectId: string, nonce: string, secret: string): Buffer {
  // This is message authentication, not password hashing: HMAC-SHA256 keyed
  // with the server secret provides integrity for the public version label,
  // the subject id, and the random nonce. No password is stored or derived.
  const payload = [STATE_FORMAT_VERSION, subjectId, nonce].join("\0");
  return createHmac("sha256", secret).update(payload).digest();
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

  return `${STATE_FORMAT_VERSION}.${nonce}.${signature}`;
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
    version !== STATE_FORMAT_VERSION ||
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
