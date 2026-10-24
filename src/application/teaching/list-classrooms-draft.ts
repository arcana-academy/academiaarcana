import { evaluateAuthorization } from "@/core/authorization";
import type { AuthorizationPolicy, AccessDecision } from "@/core/authorization";

/**
 * Draft contract for Professor → Turmas. NOT connected to a route or production
 * data source. A context-level grant alone must never expose student/class data.
 * Operational adapters require approved identity, assignment and RLS contracts.
 */
export type TeacherClassroomRecord = Readonly<{
  id: string;
  contextId: string;
  title: string;
}>;

export type ScopedTeacherClassroomReader = Readonly<{
  /** Server-only adapter; responsible for DB-side RLS and scoped queries. */
  listForTeacherInContext(
    actorId: string,
    contextId: string,
  ): Promise<readonly TeacherClassroomRecord[]>;
}>;

/**
 * Independent, server-side proof of a current teacher-to-class assignment.
 * Must check revocation on each operation. An unverified role, JWT user_metadata,
 * visible class name or mock identity MUST NOT be used as a proof.
 *
 * This is a dependency contract only: no provider or production policy is
 * registered by this draft module.
 */
export type ActiveTeacherClassBindingVerifier = Readonly<{
  isActiveTeacherClassBinding(
    actorId: string,
    contextId: string,
    classId: string,
  ): Promise<boolean>;
}>;

export type ClassroomListOutcome =
  | Readonly<{ status: "denied"; reason: "policy-denied" | "missing-permission" | "wrong-context" | "unauthenticated" | "not-explicitly-shared" }>
  | Readonly<{ status: "unavailable" }>
  | Readonly<{ status: "ok"; classrooms: readonly TeacherClassroomRecord[] }>;

type Input = Readonly<{
  /** Trusted, verified server claims only, never arbitrary browser input. */
  actorId: string | null | undefined;
  /** Trusted institutional context only. */
  contextId: string | null | undefined;
  authorization?: AuthorizationPolicy;
  reader?: ScopedTeacherClassroomReader;
  bindingVerifier?: ActiveTeacherClassBindingVerifier;
}>;

/**
 * Defense in depth for a future adapter, NOT a replacement for database RLS.
 * No policy, missing verifier, revoked relationship, cross-context records and
 * thrown provider errors must never produce an authorized classroom record.
 */
export async function listTeacherClassroomsDraft({
  actorId,
  contextId,
  authorization,
  reader,
  bindingVerifier,
}: Input): Promise<ClassroomListOutcome> {
  if (!actorId || !actorId.trim() || actorId !== actorId.trim()) {
    return { status: "denied", reason: "unauthenticated" };
  }
  if (!contextId || !contextId.trim() || contextId !== contextId.trim()) {
    return { status: "denied", reason: "wrong-context" };
  }

  const request = { actorId, contextId, purpose: "teacher-classrooms", action: "read" as const };

  // A context-level decision is necessary but NOT sufficient for a row.
  let contextDecision: AccessDecision;
  try {
    contextDecision = evaluateAuthorization(
      { ...request, resourceId: `teacher-classrooms:${contextId}` },
      authorization,
    );
  } catch {
    // Never propagate provider errors (including messages about protected data).
    return { status: "unavailable" };
  }
  if (!contextDecision.allowed) {
    return { status: "denied", reason: contextDecision.reason };
  }
  if (contextDecision.scope !== "context") {
    return { status: "denied", reason: "wrong-context" };
  }

  // Absence of an independent binding check blocks the reader entirely.
  if (!reader || !bindingVerifier) return { status: "unavailable" };

  try {
    const candidates = await reader.listForTeacherInContext(actorId, contextId);
    const classrooms: TeacherClassroomRecord[] = [];
    for (const entry of candidates) {
      if (
        !entry || entry.contextId !== contextId ||
        !entry.id?.trim() || entry.id !== entry.id.trim() ||
        !entry.title?.trim()
      ) continue;

      const rowDecision = evaluateAuthorization(
        { ...request, resourceId: entry.id },
        authorization,
      );
      if (!rowDecision.allowed || rowDecision.scope !== "context") continue;

      // No positive proof means no row. A failure invalidates the full response.
      const active = await bindingVerifier.isActiveTeacherClassBinding(
        actorId, contextId, entry.id,
      );
      if (active === true) classrooms.push(entry);
    }
    return { status: "ok", classrooms };
  } catch {
    // Deny partial results and hide internal policy, assignment or DB errors.
    return { status: "unavailable" };
  }
}
