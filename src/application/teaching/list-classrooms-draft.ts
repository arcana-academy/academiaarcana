import { evaluateAuthorization } from "@/core/authorization";
import type { AuthorizationPolicy, AccessDecision } from "@/core/authorization";

/**
 * Prototype contract for the first Professor → Turmas listing.
 *
 * This module is intentionally NOT wired to a route or live data source.
 * A verified teacher/class relationship, row-level controls and canonical
 * authorization policy must exist before an adapter may be registered.
 */
export type TeacherClassroomRecord = Readonly<{
  id: string;
  contextId: string;
  title: string;
}>;

export type ScopedTeacherClassroomReader = Readonly<{
  /** Server-only adapter: must enforce access controls and row-level security. */
  listForTeacherInContext(
    actorId: string,
    contextId: string,
  ): Promise<readonly TeacherClassroomRecord[]>;
}>;

export type ClassroomListOutcome =
  | Readonly<{ status: "denied"; reason: "policy-denied" | "missing-permission" | "wrong-context" | "unauthenticated" | "not-explicitly-shared" }>
  | Readonly<{ status: "unavailable" }>
  | Readonly<{ status: "ok"; classrooms: readonly TeacherClassroomRecord[] }>;

type Input = Readonly<{
  actorId: string | null | undefined;
  contextId: string | null | undefined;
  authorization?: AuthorizationPolicy;
  reader?: ScopedTeacherClassroomReader;
}>;

export async function listTeacherClassroomsDraft({
  actorId,
  contextId,
  authorization,
  reader,
}: Input): Promise<ClassroomListOutcome> {
  if (!actorId?.trim()) return { status: "denied", reason: "unauthenticated" };
  if (!contextId?.trim()) return { status: "denied", reason: "wrong-context" };
  const base = { actorId, contextId, purpose: "teacher-classrooms", action: "read" as const };
  const decision: AccessDecision = evaluateAuthorization(
    { ...base, resourceId: `teacher-classrooms:${contextId}` },
    authorization,
  );
  if (!decision.allowed) return { status: "denied", reason: decision.reason };
  if (decision.scope !== "context") return { status: "denied", reason: "wrong-context" };
  if (!reader) return { status: "unavailable" };

  try {
    const candidates = await reader.listForTeacherInContext(actorId, contextId);
    const classrooms = candidates.filter((entry) => {
      if (entry.contextId !== contextId || !entry.id || !entry.title) return false;
      const rowDecision = evaluateAuthorization(
        { ...base, resourceId: entry.id },
        authorization,
      );
      return rowDecision.allowed && rowDecision.scope === "context";
    });
    return { status: "ok", classrooms };
  } catch {
    // Do not expose backend errors or any partial rows to UI consumers.
    return { status: "unavailable" };
  }
}
