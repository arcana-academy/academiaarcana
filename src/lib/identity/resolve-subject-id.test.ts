import { describe, expect, it } from "vitest";

import { createResolveSubjectId } from "./resolve-subject-id";

describe("createResolveSubjectId", () => {
  it("retorna o subjectId quando getClaims retorna uma claim válida", async () => {
    const getClaims = async () => ({
      data: {
        claims: {
          sub: "user-123",
        },
      },
      error: null,
    });

    const resolveSubjectId = createResolveSubjectId(getClaims);

    await expect(resolveSubjectId()).resolves.toBe("user-123");
  });

  it("retorna null quando getClaims não possui claims", async () => {
    const getClaims = async () => ({
      data: {
        claims: null,
      },
      error: null,
    });

    const resolveSubjectId = createResolveSubjectId(getClaims);

    await expect(resolveSubjectId()).resolves.toBeNull();
  });

  it("propaga erro quando getClaims rejeita", async () => {
    const expectedError = new Error("Falha ao obter claims.");

    const getClaims = async () => {
      throw expectedError;
    };

    const resolveSubjectId = createResolveSubjectId(getClaims);

    await expect(resolveSubjectId()).rejects.toThrow("Falha ao obter claims.");
  });

  it("propaga falha do getClaims como erro de resolução de identidade", async () => {
    const expectedError = new Error("Falha ao obter claims.");

    const getClaims = async () => ({
      data: {
        claims: null,
      },
      error: expectedError,
    });

    const resolveSubjectId = createResolveSubjectId(getClaims);

    await expect(resolveSubjectId()).rejects.toThrow("Falha ao obter claims.");
  });
});
