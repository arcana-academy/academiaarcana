import { describe, expect, it } from "vitest";

import type { Identity } from "@/core/identity";

import type {
  ApplicationIdentityState,
} from "./contracts";

import {
  createIdentityResolver,
} from "./IdentityResolver";

describe("IdentityResolver", () => {
  it("resolve uma identidade autenticada a partir do subjectId", async () => {
    const identity: Identity = {
      subjectId: "user-123",
      status: "active",
    };

    const resolver = createIdentityResolver({
      resolveSubjectId: async () => identity.subjectId,
    });

    const result: ApplicationIdentityState =
      await resolver.resolve();

    expect(result).toEqual({
      status: "authenticated",
      identity,
      error: null,
    });
  });

  it("resolve como anônimo quando não existe subjectId", async () => {
    const resolver = createIdentityResolver({
      resolveSubjectId: async () => null,
    });

    const result = await resolver.resolve();

    expect(result).toEqual({
      status: "anonymous",
      identity: null,
      error: null,
    });
  });

  it("retorna erro estruturado quando a resolução da identidade falha", async () => {
    const resolver = createIdentityResolver({
      resolveSubjectId: async () => {
        throw new Error("Falha ao resolver identidade.");
      },
    });

    const result = await resolver.resolve();

    expect(result).toEqual({
      status: "error",
      identity: null,
      error: {
        code: "IDENTITY_RESOLUTION_FAILED",
        message: "Falha ao resolver identidade.",
      },
    });
  });
});