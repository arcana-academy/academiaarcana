import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient }));

import {
  getOutlookAccessToken,
  isOutlookCalendarConnected,
  storeOutlookTokens,
} from "./outlook-calendar-session";
import { OutlookCalendarError } from "./outlook-calendar";

type StoredCredential = {
  access_token_ciphertext: string;
  refresh_token_ciphertext: string;
  access_expires_at: string;
};

const records = new Map<string, StoredCredential>();
const removedOwners: string[] = [];
let activeOwner = "synthetic-owner-a";

function makeClient() {
  return {
    auth: {
      getClaims: vi.fn(async () => ({
        data: { claims: { sub: activeOwner } },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      upsert: vi.fn(async (row: StoredCredential & {
        owner_id: string; provider_id: string;
      }) => {
        records.set(row.owner_id, {
          access_token_ciphertext: row.access_token_ciphertext,
          refresh_token_ciphertext: row.refresh_token_ciphertext,
          access_expires_at: row.access_expires_at,
        });
        return { error: null };
      }),
      select: vi.fn(() => {
        let owner = "";
        return {
          eq(field: string, value: string) {
            if (field === "owner_id") owner = value;
            return this;
          },
          async maybeSingle() {
            return { data: records.get(owner) ?? null, error: null };
          },
        };
      }),
      delete: vi.fn(() => {
        let owner = "";
        return {
          eq(field: string, value: string) {
            if (field === "owner_id") {
              owner = value;
              return this;
            }
            if (field === "provider_id") {
              removedOwners.push(owner);
              records.delete(owner);
              return Promise.resolve({ error: null });
            }
            return this;
          },
        };
      }),
    })),
  };
}

async function seedOwners() {
  const expiry = new Date(Date.now() - 120_000).toISOString();
  await storeOutlookTokens("synthetic-owner-a", {
    accessToken: "synthetic-expired-access-a",
    refreshToken: "synthetic-refresh-a",
    expiresAt: expiry,
  });
  await storeOutlookTokens("synthetic-owner-b", {
    accessToken: "synthetic-expired-access-b",
    refreshToken: "synthetic-refresh-b",
    expiresAt: expiry,
  });
}

describe("Outlook refresh: retain owner-bound tokens through provider outages", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    records.clear();
    removedOwners.length = 0;
    activeOwner = "synthetic-owner-a";
    vi.stubEnv("OUTLOOK_CALENDAR_SESSION_SECRET",
      "synthetic-secret-at-least-32-characters-long");
    vi.stubEnv("MICROSOFT_ENTRA_CLIENT_ID", "synthetic-client-id");
    vi.stubEnv("MICROSOFT_ENTRA_CLIENT_SECRET", "synthetic-client-secret");
    vi.stubEnv("MICROSOFT_ENTRA_REDIRECT_URI",
      "https://example.invalid/api/integrations/outlook/callback");
    createClient.mockImplementation(async () => makeClient());
    await seedOwners();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it.each([429, 500, 503])(
    "keeps the persisted credentials on temporary refresh HTTP %i",
    async (status) => {
      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify({ error: "temporarily_unavailable" }), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      await expect(getOutlookAccessToken({ refresh: true })).rejects.toMatchObject({
        name: "OutlookCalendarError",
        status,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(records.has("synthetic-owner-a")).toBe(true);
      expect(records.has("synthetic-owner-b")).toBe(true);
      expect(removedOwners).toEqual([]);
      expect(await isOutlookCalendarConnected()).toBe(true);
    },
  );

  it("does not erase credentials on network timeout", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("synthetic-connection-reset");
    }));
    await expect(getOutlookAccessToken({ refresh: true }))
      .rejects.toBeInstanceOf(OutlookCalendarError);
    expect(records.has("synthetic-owner-a")).toBe(true);
    expect(removedOwners).toEqual([]);
  });

  it("preserves tokens on an unrelated OAuth client configuration error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: "invalid_client" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    ));
    await expect(getOutlookAccessToken({ refresh: true })).rejects.toMatchObject({
      status: 400,
    });
    expect(removedOwners).toEqual([]);
    expect(records.has("synthetic-owner-a")).toBe(true);
  });

  it("preserves tokens when a 400 response is malformed or not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response("synthetic error HTML", { status: 400 }),
    ));
    await expect(getOutlookAccessToken({ refresh: true })).rejects.toMatchObject({
      status: 400,
    });
    expect(removedOwners).toEqual([]);
    expect(records.has("synthetic-owner-a")).toBe(true);
  });

  it("deletes only the current user's tokens after a confirmed invalid_grant", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({
        error: "invalid_grant",
        error_description: "synthetic-private-provider-diagnostics",
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    ));
    let error: unknown;
    try {
      await getOutlookAccessToken({ refresh: true });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(OutlookCalendarError);
    expect(error).toMatchObject({ status: 400 });
    expect((error as Error).message).not.toContain(
      "synthetic-private-provider-diagnostics",
    );
    expect(removedOwners).toEqual(["synthetic-owner-a"]);
    expect(records.has("synthetic-owner-a")).toBe(false);
    expect(records.has("synthetic-owner-b")).toBe(true);
    activeOwner = "synthetic-owner-b";
    expect(await isOutlookCalendarConnected()).toBe(true);
  });

  it("refreshes and persists a new access token without losing the old refresh token", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({
        access_token: "synthetic-access-rotated",
        expires_in: 3600,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ));

    await expect(getOutlookAccessToken({ refresh: true }))
      .resolves.toBe("synthetic-access-rotated");
    await expect(getOutlookAccessToken())
      .resolves.toBe("synthetic-access-rotated");
    expect(removedOwners).toEqual([]);
    expect(records.has("synthetic-owner-b")).toBe(true);
    expect(await isOutlookCalendarConnected()).toBe(true);
  });

  it("does not access another user's credentials when no subject is present", async () => {
    createClient.mockImplementation(async () => ({
      ...makeClient(),
      auth: { getClaims: vi.fn(async () => ({ data: { claims: null }, error: null })) },
    }));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(getOutlookAccessToken({ refresh: true })).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(records.size).toBe(2);
    expect(removedOwners).toEqual([]);
  });
});
