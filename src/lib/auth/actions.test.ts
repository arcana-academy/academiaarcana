import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_LOGOUT_STATE } from "./logout-state";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  remoteSignOut: vi.fn(),
  clearLocalAuthSession: vi.fn(),
  redirect: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("./ssr-logout-cleanup", () => ({
  clearLocalAuthSession: mocks.clearLocalAuthSession,
}));

import { finishLocalLogout, signOut } from "./actions";

const invoke = () => signOut(INITIAL_LOGOUT_STATE, new FormData());
const localOnly = () => finishLocalLogout(INITIAL_LOGOUT_STATE, new FormData());

describe("remote-first global signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.createClient.mockResolvedValue({
      auth: {
        getSession: mocks.getSession,
        admin: { signOut: mocks.remoteSignOut },
      },
    });
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: "synthetic-access-token" } },
      error: null,
    });
    mocks.remoteSignOut.mockResolvedValue({ data: null, error: null });
    mocks.clearLocalAuthSession.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("revokes globally before clearing cookies and redirects only after cleanup", async () => {
    await invoke();
    expect(mocks.remoteSignOut).toHaveBeenCalledWith(
      "synthetic-access-token",
      "global",
    );
    expect(mocks.clearLocalAuthSession).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
    expect(mocks.remoteSignOut.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.clearLocalAuthSession.mock.invocationCallOrder[0],
    );
    expect(mocks.clearLocalAuthSession.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.redirect.mock.invocationCallOrder[0],
    );
  });

  it.each([400, 404, 429, 500, 503])(
    "does not remove cookies or redirect when Auth reports HTTP %s",
    async (status) => {
      mocks.remoteSignOut.mockResolvedValueOnce({
        error: { status, name: "AuthApiError" },
      });
      await expect(invoke()).resolves.toEqual({ status: "revocation_failed" });
      expect(mocks.clearLocalAuthSession).not.toHaveBeenCalled();
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );

  it.each([401, 403])(
    "does not consider HTTP %s successful",
    async (status) => {
      mocks.remoteSignOut.mockResolvedValueOnce({
        error: { status, name: "AuthApiError" },
      });
      await expect(invoke()).resolves.toEqual({ status: "reauth_required" });
      expect(mocks.clearLocalAuthSession).not.toHaveBeenCalled();
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );

  it("returns outcome_unknown for a rejected network request", async () => {
    mocks.remoteSignOut.mockRejectedValueOnce({
      status: 0,
      name: "AuthRetryableFetchError",
    });
    await expect(invoke()).resolves.toEqual({ status: "outcome_unknown" });
    expect(mocks.clearLocalAuthSession).not.toHaveBeenCalled();
  });

  it("returns outcome_unknown for a resolved retryable fetch error", async () => {
    mocks.remoteSignOut.mockResolvedValueOnce({
      error: { status: 0, name: "AuthRetryableFetchError" },
    });
    await expect(invoke()).resolves.toEqual({ status: "outcome_unknown" });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("handles thrown errors without deleting cookies", async () => {
    mocks.remoteSignOut.mockRejectedValueOnce(new Error("transport failed"));
    await expect(invoke()).resolves.toEqual({ status: "unexpected_error" });
    expect(mocks.clearLocalAuthSession).not.toHaveBeenCalled();
  });

  it("does not revoke globally without a usable session", async () => {
    mocks.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });
    await expect(invoke()).resolves.toEqual({ status: "reauth_required" });
    expect(mocks.remoteSignOut).not.toHaveBeenCalled();
    expect(mocks.clearLocalAuthSession).not.toHaveBeenCalled();
  });

  it("classifies a session acquisition exception separately", async () => {
    mocks.getSession.mockRejectedValueOnce(new Error("session unavailable"));
    await expect(invoke()).resolves.toEqual({ status: "unexpected_error" });
    expect(mocks.remoteSignOut).not.toHaveBeenCalled();
  });

  it("allows a retry when a transient failure leaves the session usable", async () => {
    mocks.remoteSignOut.mockResolvedValueOnce({
      error: { status: 503 },
    });
    expect(await invoke()).toEqual({ status: "revocation_failed" });
    expect(mocks.clearLocalAuthSession).not.toHaveBeenCalled();
    await invoke();
    expect(mocks.remoteSignOut).toHaveBeenCalledTimes(2);
    expect(mocks.clearLocalAuthSession).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledTimes(1);
  });

  it("reports incomplete local cleanup after confirmed global revocation", async () => {
    mocks.clearLocalAuthSession.mockRejectedValueOnce(new Error("cookie failure"));
    await expect(invoke()).resolves.toEqual({ status: "cleanup_incomplete" });
    expect(mocks.remoteSignOut).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("local-only recovery never trusts client state or repeats remote revocation", async () => {
    await localOnly();
    expect(mocks.remoteSignOut).not.toHaveBeenCalled();
    expect(mocks.clearLocalAuthSession).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("reports a local-only cleanup error instead of redirecting", async () => {
    mocks.clearLocalAuthSession.mockRejectedValueOnce(new Error("cookie failure"));
    await expect(localOnly()).resolves.toEqual({ status: "cleanup_incomplete" });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("does not include credentials or provider messages in logs", async () => {
    mocks.remoteSignOut.mockResolvedValueOnce({
      error: { status: 503, message: "private-jwt-value" },
    });
    await invoke();
    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logged).not.toContain("synthetic-access-token");
    expect(logged).not.toContain("private-jwt-value");
  });
});
