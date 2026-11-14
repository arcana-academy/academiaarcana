import { timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";

/** Credential is mounted at runtime, never placed in build environment. */
export const DEMO_ACCESS_FILE = "/etc/secrets/AA_DEMO_GATE";

/** Reads the runtime-only access file or fails closed without exposing it. */
export function readDemoAccessCode(): string | null {
  try {
    const value = readFileSync(DEMO_ACCESS_FILE, "utf8").trim();
    if (value.length < 24 || value.length > 256 || /[\r\n]/.test(value)) return null;
    return value;
  } catch {
    return null;
  }
}

/** Decodes Basic-auth data, rejecting malformed headers. */
function decodeBasicCredentials(header: string | null): string | null {
  if (!header?.startsWith("Basic ") || header.length > 1024) return null;
  const encoded = header.slice(6);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;
  try {
    return Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

/** Recognizes the synthetic-only demo principal. */
function getDemoPassword(credentials: string | null): string | null {
  if (credentials === null) return null;
  const divider = credentials.indexOf(":");
  if (divider < 0 || credentials.slice(0, divider) !== "arcana-demo") return null;
  return credentials.slice(divider + 1);
}

/** Checks matching byte lengths before a timing-safe comparison. */
function matchesDemoPassword(candidate: string, expected: string): boolean {
  const actual = Buffer.from(candidate, "utf8");
  const reference = Buffer.from(expected, "utf8");
  return actual.length === reference.length && timingSafeEqual(actual, reference);
}

/** Constant-time demo credential check, never granting student identity. */
export function authorizeDemoBasic(header: string | null, expected: string): boolean {
  if (!expected) return false;
  const candidate = getDemoPassword(decodeBasicCredentials(header));
  return candidate !== null && matchesDemoPassword(candidate, expected);
}

/** Deny all real application routes and API endpoints in isolated mode. */
export function isAllowedDemoPath(pathname: string): boolean {
  return pathname === "/" ||
    pathname === "/design-system/pilots/mvp" ||
    pathname === "/design-system/pilots/mvp/";
}
