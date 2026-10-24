import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

import {
  getOutlookAccessToken,
  storeOutlookTokens,
} from "./outlook-calendar-session";

describe("Outlook Calendar credential session", () => {
  it("persists encrypted token material instead of plaintext", async () => {
    process.env.OUTLOOK_CALENDAR_SESSION_SECRET =
      "test-secret-with-at-least-32-characters-long";

    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({
      upsert,
    }));

    mocks.createClient.mockResolvedValue({
      from,
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "user-1" } },
          error: null,
        }),
      },
    });

    await storeOutlookTokens("user-1", {
      accessToken: "access-token-secret",
      refreshToken: "refresh-token-secret",
      expiresAt: "2099-01-01T00:00:00.000Z",
    });

    const payload = upsert.mock.calls[0]?.[0];

    expect(payload).toMatchObject({
      owner_id: "user-1",
      provider_id: "outlook-calendar",
    });
    expect(payload.access_token_ciphertext).not.toContain("access-token-secret");
    expect(payload.refresh_token_ciphertext).not.toContain("refresh-token-secret");
  });

  it("decrypts a valid stored access token for the authenticated owner", async () => {
    process.env.OUTLOOK_CALENDAR_SESSION_SECRET =
      "test-secret-with-at-least-32-characters-long";

    let stored:
      | {
          access_token_ciphertext: string;
          refresh_token_ciphertext: string;
          access_expires_at: string;
        }
      | undefined;

    const upsert = vi.fn().mockImplementation(async (payload) => {
      stored = {
        access_token_ciphertext: payload.access_token_ciphertext,
        refresh_token_ciphertext: payload.refresh_token_ciphertext,
        access_expires_at: payload.access_expires_at,
      };
      return { error: null };
    });

    mocks.createClient.mockImplementation(async () => ({
      from: vi.fn(() => ({
        upsert,
        select: vi.fn(() => ({
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn(async () => ({
            data: stored,
            error: null,
          })),
        })),
      })),
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "user-1" } },
          error: null,
        }),
      },
    }));

    await storeOutlookTokens("user-1", {
      accessToken: "access-token-secret",
      refreshToken: "refresh-token-secret",
      expiresAt: "2099-01-01T00:00:00.000Z",
    });

    await expect(getOutlookAccessToken()).resolves.toBe("access-token-secret");
  });
  async function setupExpiredCredential() {
    vi.stubEnv("OUTLOOK_CALENDAR_SESSION_SECRET", "test-secret-with-at-least-32-characters-long");
    vi.stubEnv("MICROSOFT_ENTRA_CLIENT_ID", "synthetic-client-id");
    vi.stubEnv("MICROSOFT_ENTRA_CLIENT_SECRET", "synthetic-client-secret");
    vi.stubEnv("MICROSOFT_ENTRA_REDIRECT_URI", "https://example.test/oauth/callback");

    let stored: {
      access_token_ciphertext: string;
      refresh_token_ciphertext: string;
      access_expires_at: string;
    } | null = null;
    const upsert = vi.fn(async (payload: {
      access_token_ciphertext: string;
      refresh_token_ciphertext: string;
      access_expires_at: string;
    }) => {
      stored = {
        access_token_ciphertext: payload.access_token_ciphertext,
        refresh_token_ciphertext: payload.refresh_token_ciphertext,
        access_expires_at: payload.access_expires_at,
      };
      return { error: null };
    });
    const deletion = { eq: vi.fn() };
    deletion.eq.mockReturnValueOnce(deletion).mockResolvedValueOnce({ error: null });
    const remove = vi.fn(() => deletion);
    const from = vi.fn(() => ({
      upsert,
      delete: remove,
      select: vi.fn(() => ({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(async () => ({ data: stored, error: null })),
      })),
    }));
    mocks.createClient.mockImplementation(async () => ({
      from,
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "user-1" } },
          error: null,
        }),
      },
    }));
    await storeOutlookTokens("user-1", {
      accessToken: "synthetic-expired-access",
      refreshToken: "synthetic-refresh-secret",
      expiresAt: "2020-01-01T00:00:00.000Z",
    });
    return { upsert, remove, deletion, from, readStored: () => stored };
  }

  it.each([
    { status: 429, errorCode: "temporarily_unavailable" },
    { status: 503, errorCode: "server_error" },
    { status: 400, errorCode: "invalid_request" },
    { status: 401, errorCode: "invalid_client" },
  ])("preserves refresh credentials on recoverable OAuth HTTP $status ($errorCode)", async ({ status, errorCode }) => {
    try {
      const store = await setupExpiredCredential();
      const before = store.readStored();
      const fetchMock = vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response(
          JSON.stringify({ error: errorCode, error_description: "private provider diagnostic" }),
          { status, headers: { "Content-Type": "application/json" } },
        ))
        .mockResolvedValueOnce(new Response(
          JSON.stringify({
            access_token: "synthetic-recovered-access",
            refresh_token: "synthetic-rotated-refresh",
            expires_in: 3600,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ));

      await expect(getOutlookAccessToken({ refresh: true })).rejects.toThrow(
        "Não foi possível renovar a conexão do Outlook. Tente novamente.",
      );
      expect(store.remove).not.toHaveBeenCalled();
      expect(store.readStored()).toEqual(before);

      await expect(getOutlookAccessToken({ refresh: true })).resolves.toBe(
        "synthetic-recovered-access",
      );
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(store.remove).not.toHaveBeenCalled();
      expect(store.upsert).toHaveBeenCalledTimes(2);
      await expect(getOutlookAccessToken()).resolves.toBe("synthetic-recovered-access");
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    }
  });

  it("clears only the authenticated owner's credentials for an explicit revoked refresh token", async () => {
    try {
      const store = await setupExpiredCredential();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(
        JSON.stringify({ error: "invalid_grant" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      ));

      await expect(getOutlookAccessToken({ refresh: true })).rejects.toThrow(
        "A autorização do Outlook expirou. Conecte novamente sua conta.",
      );
      expect(store.remove).toHaveBeenCalledTimes(1);
      expect(store.deletion.eq).toHaveBeenCalledWith("owner_id", "user-1");
      expect(store.deletion.eq).toHaveBeenCalledWith("provider_id", "outlook-calendar");
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    }
  });

  it("preserves credentials when a failed OAuth response is not JSON", async () => {
    try {
      const store = await setupExpiredCredential();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("gateway unavailable", { status: 502 }),
      );

      await expect(getOutlookAccessToken({ refresh: true })).rejects.toThrow(
        "Não foi possível renovar a conexão do Outlook. Tente novamente.",
      );
      expect(store.remove).not.toHaveBeenCalled();
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    }
  });

});
