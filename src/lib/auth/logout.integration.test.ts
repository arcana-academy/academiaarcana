import { clearAuthCookiesAtScopes, createServerClient } from "@supabase/ssr";
import { describe, expect, it, vi } from "vitest";

import { getSupabaseAuthStorageKey } from "@/infrastructure/supabase/auth-storage";

type CookieWrite = {
  name: string;
  value: string;
  options?: { maxAge?: number; path?: string; domain?: string };
};

function makeCookieJar() {
  const values = new Map<string, string>();
  const writes: CookieWrite[] = [];
  return {
    values,
    writes,
    getAll: () => Array.from(values, ([name, value]) => ({ name, value })),
    setAll: (entries: CookieWrite[]) => {
      for (const entry of entries) {
        writes.push(entry);
        if (entry.options?.maxAge === 0) {
          values.delete(entry.name);
        } else {
          values.set(entry.name, entry.value);
        }
      }
    },
  };
}

const authUrl = "https://example.supabase.co";
const storageKey = getSupabaseAuthStorageKey(authUrl);

function jwt() {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    sub: "synthetic-user",
    aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64url");
  return header + "." + payload + ".synthetic-signature";
}

function makeAuthFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/auth/v1/user")) {
      return new Response(JSON.stringify({
        id: "synthetic-user",
        aud: "authenticated",
        app_metadata: {},
        user_metadata: {},
        created_at: "2026-01-01T00:00:00Z",
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/auth/v1/logout")) {
      return new Response(JSON.stringify({
        code: "unexpected_failure",
        msg: "Simulated Auth outage",
      }), {
        status: 503,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ msg: "unexpected endpoint" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  });
}

async function seededClient() {
  const jar = makeCookieJar();
  const fetch = makeAuthFetch();
  const client = createServerClient(authUrl, "sb_publishable_synthetic", {
    auth: { storageKey },
    global: { fetch },
    cookies: {
      getAll: jar.getAll,
      setAll: jar.setAll,
    },
  });

  const { error } = await client.auth.setSession({
    access_token: jwt(),
    refresh_token: "synthetic-refresh-token",
  });
  expect(error).toBeNull();
  expect(jar.getAll().some(({ name }) => name === storageKey ||
    name.startsWith(storageKey + "."))).toBe(true);

  const session = await client.auth.getSession();
  expect(session.data.session?.access_token).toBeTruthy();
  return { client, jar, fetch, accessToken: session.data.session!.access_token };
}

describe("Supabase Auth 2.117.2 and SSR 0.12.7 regression", () => {
  it("reproduces legacy global signOut clearing cookies on an HTTP 503", async () => {
    const { client, jar } = await seededClient();
    const { error } = await client.auth.signOut({ scope: "global" });
    expect(error).not.toBeNull();
    expect(jar.getAll().some(({ name }) => name === storageKey ||
      name.startsWith(storageKey + "."))).toBe(false);
  });

  it("preserves cookies when the remote-first admin revocation returns 503", async () => {
    const { client, jar, accessToken } = await seededClient();
    const before = jar.getAll();
    const { error } = await client.auth.admin.signOut(accessToken, "global");
    expect(error).not.toBeNull();
    expect(jar.getAll()).toEqual(before);
  });

  it("clears all currently present auth chunks without touching other cookies", async () => {
    const jar = makeCookieJar();
    jar.values.set(storageKey + ".0", "chunk0");
    jar.values.set(storageKey + ".1", "chunk1");
    jar.values.set(storageKey + ".2", "chunk2");
    jar.values.set("unrelated", "keep");
    await clearAuthCookiesAtScopes({
      storageKey,
      scopes: [{ path: "/" }],
      getAll: jar.getAll,
      setAll: jar.setAll,
    });
    expect(jar.values.has(storageKey + ".0")).toBe(false);
    expect(jar.values.has(storageKey + ".1")).toBe(false);
    expect(jar.values.has(storageKey + ".2")).toBe(false);
    expect(jar.values.get("unrelated")).toBe("keep");
    expect(jar.writes.filter((entry) => entry.options?.maxAge === 0))
      .toHaveLength(3);
  });


  it("AUTH-P1-015: upstream helper issues expirations for explicitly configured cookie scopes", async () => {
    const jar = makeCookieJar();
    jar.values.set(storageKey + ".0", "a");
    jar.values.set(storageKey + ".1", "b");
    await clearAuthCookiesAtScopes({
      storageKey,
      scopes: [
        { path: "/", domain: ".example.com" },
        { path: "/legacy" },
      ],
      getAll: jar.getAll,
      setAll: jar.setAll,
    });
    expect(jar.writes).toHaveLength(4);
    expect(jar.writes.filter(({ options }) =>
      options?.path === "/" && options?.domain === ".example.com")).toHaveLength(2);
    expect(jar.writes.filter(({ options }) =>
      options?.path === "/legacy" && !options?.domain)).toHaveLength(2);
    expect(jar.writes.every(({ options }) => options?.maxAge === 0)).toBe(true);
  });

  it("does not silently ignore cookie write errors", async () => {
    await expect(clearAuthCookiesAtScopes({
      storageKey,
      scopes: [{ path: "/" }],
      getAll: () => [{ name: storageKey, value: "auth" }],
      setAll: () => { throw new Error("set-cookie rejected"); },
    })).rejects.toThrow("set-cookie rejected");
  });
});
