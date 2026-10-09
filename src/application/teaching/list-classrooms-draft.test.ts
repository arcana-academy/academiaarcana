import { describe, expect, it, vi } from "vitest";
import { listTeacherClassroomsDraft, type ScopedTeacherClassroomReader } from "./list-classrooms-draft";
import type { AuthorizationPolicy } from "@/core/authorization/contracts";

const reader = (): ScopedTeacherClassroomReader => ({
  listForTeacherInContext: vi.fn(async () => [
    { id: "class-1", contextId: "school-A", title: "Turma A" },
    { id: "class-foreign", contextId: "school-B", title: "Turma B" },
    { id: "class-private", contextId: "school-A", title: "Turma Privada" },
  ]),
});

const policy: AuthorizationPolicy = ({ resourceId, contextId }) =>
  contextId === "school-A" && resourceId !== "class-private"
    ? { allowed: true, scope: "context" }
    : { allowed: false, reason: "missing-permission" };

describe("proposed teacher classroom boundary", () => {
  it("refuses absent identity or context without reading rows", async () => {
    const gateway = reader();
    expect(await listTeacherClassroomsDraft({ actorId: null, contextId: "school-A", reader: gateway }))
      .toEqual({ status: "denied", reason: "unauthenticated" });
    expect(await listTeacherClassroomsDraft({ actorId: "prof-1", contextId: null, reader: gateway }))
      .toEqual({ status: "denied", reason: "wrong-context" });
    expect(gateway.listForTeacherInContext).not.toHaveBeenCalled();
  });

  it("defaults to denial when role policy is not supplied", async () => {
    const gateway = reader();
    expect(await listTeacherClassroomsDraft({ actorId: "prof-1", contextId: "school-A", reader: gateway }))
      .toEqual({ status: "denied", reason: "policy-denied" });
    expect(gateway.listForTeacherInContext).not.toHaveBeenCalled();
  });

  it("rejects self-scoped grants and missing backend adapters", async () => {
    const selfPolicy: AuthorizationPolicy = () => ({ allowed: true, scope: "self" });
    const gateway = reader();
    expect(await listTeacherClassroomsDraft({
      actorId: "prof-1", contextId: "school-A", authorization: selfPolicy, reader: gateway,
    })).toEqual({ status: "denied", reason: "wrong-context" });
    expect(gateway.listForTeacherInContext).not.toHaveBeenCalled();
    expect(await listTeacherClassroomsDraft({
      actorId: "prof-1", contextId: "school-A", authorization: policy,
    })).toEqual({ status: "unavailable" });
  });

  it("filters unauthorized and foreign-context rows after the scoped query", async () => {
    const result = await listTeacherClassroomsDraft({
      actorId: "prof-1", contextId: "school-A", reader: reader(), authorization: policy,
    });
    expect(result).toEqual({
      status: "ok", classrooms: [{ id: "class-1", contextId: "school-A", title: "Turma A" }],
    });
  });

  it("does not expose partial data or adapter errors", async () => {
    const broken: ScopedTeacherClassroomReader = {
      listForTeacherInContext: vi.fn(async () => { throw new Error("internal credentials"); }),
    };
    expect(await listTeacherClassroomsDraft({
      actorId: "prof-1", contextId: "school-A", reader: broken, authorization: policy,
    })).toEqual({ status: "unavailable" });
  });
});
