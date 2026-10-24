import { describe, expect, it, vi } from "vitest";
import {
  listTeacherClassroomsDraft,
  type ActiveTeacherClassBindingVerifier,
  type ScopedTeacherClassroomReader,
} from "./list-classrooms-draft";
import type { AuthorizationPolicy } from "@/core/authorization";

const reader = (): ScopedTeacherClassroomReader => ({
  listForTeacherInContext: vi.fn(async () => [
    { id: "class-1", contextId: "school-A", title: "Turma A" },
    { id: "class-foreign", contextId: "school-B", title: "Turma B" },
    { id: "class-private", contextId: "school-A", title: "Turma Privada" },
  ]),
});

const policy: AuthorizationPolicy = ({ actorId, resourceId, contextId }) =>
  actorId === "prof-1" && contextId === "school-A" && resourceId !== "class-private"
    ? { allowed: true, scope: "context" }
    : { allowed: false, reason: "missing-permission" };

const binding = (): ActiveTeacherClassBindingVerifier => ({
  isActiveTeacherClassBinding: vi.fn(async (actorId, contextId, classId) =>
    actorId === "prof-1" && contextId === "school-A" && classId === "class-1"
  ),
});

describe("proposed teacher classroom boundary — Ciclo 15", () => {
  it("refuses missing or noncanonical identities before querying a provider", async () => {
    const gateway = reader();
    for (const actorId of [null, "", " ", " prof-1"]) {
      expect(await listTeacherClassroomsDraft({
        actorId, contextId: "school-A", reader: gateway, authorization: policy, bindingVerifier: binding(),
      })).toEqual({ status: "denied", reason: "unauthenticated" });
    }
    for (const contextId of [null, "", "school-A "]) {
      expect(await listTeacherClassroomsDraft({
        actorId: "prof-1", contextId, reader: gateway, authorization: policy, bindingVerifier: binding(),
      })).toEqual({ status: "denied", reason: "wrong-context" });
    }
    expect(gateway.listForTeacherInContext).not.toHaveBeenCalled();
  });

  it("denies absent or explicitly refusing authorization before reading any rows", async () => {
    const gateway = reader();
    expect(await listTeacherClassroomsDraft({
      actorId: "prof-1", contextId: "school-A", reader: gateway, bindingVerifier: binding(),
    })).toEqual({ status: "denied", reason: "policy-denied" });
    expect(await listTeacherClassroomsDraft({
      actorId: "prof-2", contextId: "school-A", reader: gateway,
      authorization: policy, bindingVerifier: binding(),
    })).toEqual({ status: "denied", reason: "missing-permission" });
    expect(gateway.listForTeacherInContext).not.toHaveBeenCalled();
  });

  it("rejects incorrect grant scopes and missing providers without calling the reader", async () => {
    const gateway = reader();
    const selfPolicy: AuthorizationPolicy = () => ({ allowed: true, scope: "self" });
    expect(await listTeacherClassroomsDraft({
      actorId: "prof-1", contextId: "school-A", authorization: selfPolicy,
      reader: gateway, bindingVerifier: binding(),
    })).toEqual({ status: "denied", reason: "wrong-context" });
    expect(await listTeacherClassroomsDraft({
      actorId: "prof-1", contextId: "school-A", authorization: policy, reader: gateway,
    })).toEqual({ status: "unavailable" });
    expect(await listTeacherClassroomsDraft({
      actorId: "prof-1", contextId: "school-A", authorization: policy, bindingVerifier: binding(),
    })).toEqual({ status: "unavailable" });
    expect(gateway.listForTeacherInContext).not.toHaveBeenCalled();
  });

  it("filters foreign-context, forbidden and inactive rows using both authorization and binding", async () => {
    const verifier = binding();
    expect(await listTeacherClassroomsDraft({
      actorId: "prof-1", contextId: "school-A", reader: reader(),
      authorization: policy, bindingVerifier: verifier,
    })).toEqual({
      status: "ok", classrooms: [{ id: "class-1", contextId: "school-A", title: "Turma A" }],
    });
    expect(verifier.isActiveTeacherClassBinding).toHaveBeenCalledTimes(1);
    expect(verifier.isActiveTeacherClassBinding).toHaveBeenCalledWith("prof-1", "school-A", "class-1");
  });

  it("prevents cross-account access even if a context policy is overpermissive", async () => {
    const permissive: AuthorizationPolicy = () => ({ allowed: true, scope: "context" });
    const verifier = binding();
    const output = await listTeacherClassroomsDraft({
      actorId: "prof-2", contextId: "school-A", reader: reader(),
      authorization: permissive, bindingVerifier: verifier,
    });
    expect(output).toEqual({ status: "ok", classrooms: [] });
    expect(verifier.isActiveTeacherClassBinding).toHaveBeenCalledWith("prof-2", "school-A", "class-1");
  });

  it("rechecks revocation on every request without caching a granted relationship", async () => {
    let active = true;
    const verifier: ActiveTeacherClassBindingVerifier = {
      isActiveTeacherClassBinding: vi.fn(async (_actor, _ctx, classId) => active && classId === "class-1"),
    };
    const input = {
      actorId: "prof-1", contextId: "school-A", reader: reader(),
      authorization: policy, bindingVerifier: verifier,
    };
    expect(await listTeacherClassroomsDraft(input)).toMatchObject({
      status: "ok", classrooms: [{ id: "class-1" }],
    });
    active = false;
    expect(await listTeacherClassroomsDraft(input)).toEqual({ status: "ok", classrooms: [] });
    expect(verifier.isActiveTeacherClassBinding).toHaveBeenCalledTimes(2);
  });

  it("returns unavailable, without partial data, on reader, policy or relationship errors", async () => {
    const brokenReader: ScopedTeacherClassroomReader = {
      listForTeacherInContext: vi.fn(async () => { throw new Error("sensitive adapter detail"); }),
    };
    const brokenPolicy: AuthorizationPolicy = () => { throw new Error("internal policy detail"); };
    const brokenVerifier: ActiveTeacherClassBindingVerifier = {
      isActiveTeacherClassBinding: vi.fn(async () => { throw new Error("private membership detail"); }),
    };
    const base = { actorId: "prof-1", contextId: "school-A" };
    expect(await listTeacherClassroomsDraft({
      ...base, authorization: policy, reader: brokenReader, bindingVerifier: binding(),
    })).toEqual({ status: "unavailable" });
    const safeReader = reader();
    expect(await listTeacherClassroomsDraft({
      ...base, authorization: brokenPolicy, reader: safeReader, bindingVerifier: binding(),
    })).toEqual({ status: "unavailable" });
    expect(safeReader.listForTeacherInContext).not.toHaveBeenCalled();
    expect(await listTeacherClassroomsDraft({
      ...base, authorization: policy, reader: reader(), bindingVerifier: brokenVerifier,
    })).toEqual({ status: "unavailable" });
  });

  it("rejects malformed candidate rows even when authorization is permissive", async () => {
    const malformed: ScopedTeacherClassroomReader = {
      listForTeacherInContext: vi.fn(async () => [
        { id: " ", contextId: "school-A", title: "Blank" },
        { id: "class-1 ", contextId: "school-A", title: "Trailing" },
        { id: "class-1", contextId: "school-A", title: "  " },
        { id: "class-foreign", contextId: "school-B", title: "Foreign" },
      ]),
    };
    const permissive: AuthorizationPolicy = () => ({ allowed: true, scope: "context" });
    const verifier = binding();
    expect(await listTeacherClassroomsDraft({
      actorId: "prof-1", contextId: "school-A",
      reader: malformed, authorization: permissive, bindingVerifier: verifier,
    })).toEqual({ status: "ok", classrooms: [] });
    expect(verifier.isActiveTeacherClassBinding).not.toHaveBeenCalled();
  });
});
