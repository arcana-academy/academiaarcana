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

/** Constant-time demo passphrase check, not production student authentication. */
export function authorizeDemoBasic(header: string | null, expected: string): boolean {
  if (!header?.startsWith("Basic ") || header.length > 1024 || !expected) return false;
  try {
    const encoded = header.slice(6);
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return false;
    const raw = Buffer.from(encoded, "base64").toString("utf8");
    const divider = raw.indexOf(":");
    if (divider < 0 || raw.slice(0, divider) !== "arcana-demo") return false;
    const actual = Buffer.from(raw.slice(divider + 1), "utf8");
    const reference = Buffer.from(expected, "utf8");
    return actual.length === reference.length && timingSafeEqual(actual, reference);
  } catch {
    return false;
  }
}

/** Deny all real application routes and API endpoints in isolated mode. */
export function isAllowedDemoPath(pathname: string): boolean {
  return pathname === "/" ||
    pathname === "/design-system/pilots/mvp" ||
    pathname === "/design-system/pilots/mvp/";
}
