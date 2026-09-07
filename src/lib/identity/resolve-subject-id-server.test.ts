import { describe, expect, it, vi } from "vitest";

import { createResolveSubjectIdServer } from "./resolve-subject-id-server";

describe("createResolveSubjectIdServer", () => {
  it("resolve o subjectId usando o cliente Supabase do servidor", async () => {
    const getClaims = vi.fn().mockResolvedValue({
      data: {
        claims: {
          sub: "user-123",
        },
      },
      error: null,
    });

    const createSupabaseClient = vi.fn().mockResolvedValue({
      auth: {
        getClaims,
      },
    });

    const resolveSubjectId = createResolveSubjectIdServer(createSupabaseClient);

    await expect(resolveSubjectId()).resolves.toBe("user-123");

    expect(createSupabaseClient).toHaveBeenCalledTimes(1);
    expect(getClaims).toHaveBeenCalledTimes(1);
  });

  it("retorna null quando não existe uma identidade autenticada", async () => {
    const createSupabaseClient = vi.fn().mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: {
            claims: null,
          },
          error: null,
        }),
      },
    });

    const resolveSubjectId = createResolveSubjectIdServer(createSupabaseClient);

    await expect(resolveSubjectId()).resolves.toBeNull();
  });

  it("propaga uma falha inesperada do cliente Supabase", async () => {
    const error = new Error("Falha no Supabase");

    const createSupabaseClient = vi.fn().mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockRejectedValue(error),
      },
    });

    const resolveSubjectId = createResolveSubjectIdServer(createSupabaseClient);

    await expect(resolveSubjectId()).rejects.toThrow("Falha no Supabase");
  });
});
