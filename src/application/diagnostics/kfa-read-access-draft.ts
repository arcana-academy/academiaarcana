/**
 * Draft, fail-closed authorization contract for the future KFA diagnostics panel.
 *
 * This module does not grant permissions, authenticate callers, contact providers,
 * or expose a live route. A future server adapter must supply a verified subject
 * from Supabase Auth and a trusted, revocation-aware grant verifier.
 */
export const KFA_DIAGNOSTICS_READ_PERMISSION = "diagnostics.kfa.read" as const;

export type KfaDiagnosticsGrant = Readonly<{
  subjectId: string;
  permission: string;
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}>;

/** Server-only port; never implement from client-controlled claims or metadata. */
export interface KfaDiagnosticsGrantVerifier {
  readCurrentGrant(
    subjectId: string,
    permission: typeof KFA_DIAGNOSTICS_READ_PERMISSION,
  ): Promise<KfaDiagnosticsGrant | null>;
}

export type KfaDiagnosticsAccessDecision =
  | Readonly<{ allowed: true; permission: typeof KFA_DIAGNOSTICS_READ_PERMISSION }>
  | Readonly<{
      allowed: false;
      reason: "unauthenticated" | "missing-permission" | "invalid-grant" | "unavailable";
    }>;

type Input = Readonly<{
  /** Must be resolved from a verified server-side authentication session. */
  subjectId: string | null | undefined;
  /** An absent verifier denies access. */
  grantVerifier?: KfaDiagnosticsGrantVerifier;
  /** Server-owned clock; injectable solely for deterministic synthetic tests. */
  nowMs?: number;
}>;

function parseUtcTimestamp(value: unknown): number | null {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)
  ) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Checks one exact, current operational grant. Never infers permission from
 * authentication, institutional roles, cached JWT fields or client input.
 */
export async function checkKfaDiagnosticsReadAccess({
  subjectId,
  grantVerifier,
  nowMs = Date.now(),
}: Input): Promise<KfaDiagnosticsAccessDecision> {
  if (
    typeof subjectId !== "string" ||
    subjectId.length === 0 ||
    subjectId !== subjectId.trim()
  ) {
    return { allowed: false, reason: "unauthenticated" };
  }

  if (!Number.isFinite(nowMs) || nowMs < 0) {
    return { allowed: false, reason: "unavailable" };
  }

  if (!grantVerifier) {
    return { allowed: false, reason: "missing-permission" };
  }

  let grant: KfaDiagnosticsGrant | null;
  try {
    grant = await grantVerifier.readCurrentGrant(
      subjectId,
      KFA_DIAGNOSTICS_READ_PERMISSION,
    );
  } catch {
    return { allowed: false, reason: "unavailable" };
  }

  if (!grant) {
    return { allowed: false, reason: "missing-permission" };
  }

  if (
    grant.subjectId !== subjectId ||
    grant.permission !== KFA_DIAGNOSTICS_READ_PERMISSION ||
    grant.revokedAt !== null
  ) {
    return { allowed: false, reason: "invalid-grant" };
  }

  const grantedAt = parseUtcTimestamp(grant.grantedAt);
  const expiresAt =
    grant.expiresAt === null ? Number.POSITIVE_INFINITY : parseUtcTimestamp(grant.expiresAt);

  if (
    grantedAt === null ||
    expiresAt === null ||
    grantedAt > nowMs ||
    expiresAt <= nowMs
  ) {
    return { allowed: false, reason: "invalid-grant" };
  }

  return { allowed: true, permission: KFA_DIAGNOSTICS_READ_PERMISSION };
}
