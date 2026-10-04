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
});
