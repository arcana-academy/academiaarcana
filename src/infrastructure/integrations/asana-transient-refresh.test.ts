import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshAsanaCredentials } from "./asana";

const credentials = {
  subjectId: "synthetic-owner",
  accessToken: "synthetic-expiring-access",
  refreshToken: "synthetic-long-lived-refresh",
  accessTokenExpiresAt: 1,
};

describe("Asana refresh HTTP classification — CP04 regression", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function configured() {
    vi.stubEnv("ASANA_CLIENT_ID", "synthetic-client-id");
    vi.stubEnv("ASANA_CLIENT_SECRET", "synthetic-client-secret");
  }

  it.each([408, 429, 500, 502, 503])(
    "treats upstream HTTP %i as a temporary outage without changing original credentials",
    async status => {
      configured();
      vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status })));
      await expect(refreshAsanaCredentials(credentials)).rejects.toMatchObject({
        name: "AsanaConnectionError", code: "request_failed",
      });
      expect(credentials.refreshToken).toBe("synthetic-long-lived-refresh");
    },
  );

  it.each([400, 401, 403])(
    "keeps fail-closed classification for HTTP %i without issuing usable access",
    async status => {
      configured();
      vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status })));
      await expect(refreshAsanaCredentials(credentials)).rejects.toMatchObject({
        name: "AsanaConnectionError", code: "reauthorization_required",
      });
    },
  );

  it("classifies HTTP 200 with malformed refresh JSON as retryable", async () => {
    configured();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{synthetic malformed", {
      status: 200, headers: { "Content-Type": "application/json" },
    })));
    await expect(refreshAsanaCredentials(credentials)).rejects.toMatchObject({
      name: "AsanaConnectionError", code: "request_failed",
    });
    expect(credentials.refreshToken).toBe("synthetic-long-lived-refresh");
  });

  it("treats a fetch-level network exception as a recoverable failure", async () => {
    configured();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("synthetic network outage"); }));
    await expect(refreshAsanaCredentials(credentials)).rejects.toMatchObject({
      name: "AsanaConnectionError", code: "request_failed",
    });
  });
});
