"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { clearLocalAuthSession } from "./ssr-logout-cleanup";
import type { LogoutActionState } from "./logout-state";

function classifyRevocationFailure(error: unknown): LogoutActionState {
  if (typeof error === "object" && error !== null) {
    const value = error as { status?: unknown; name?: unknown };
    if (value.status === 401 || value.status === 403) {
      return { status: "reauth_required" };
    }
    if (value.status === 0 || value.name === "AuthRetryableFetchError") {
      return { status: "outcome_unknown" };
    }
  }
  return { status: "revocation_failed" };
}

function noteFailure(stage: string, status: LogoutActionState["status"]) {
  // Only static categories; never log provider error messages or credentials.
  console.warn("auth.logout", { stage, status });
}

/**
 * The previousState and formData are UI transport only; neither authorizes
 * the remote revocation or proves that it already happened.
 */
export async function signOut(
  _previousState: LogoutActionState,
  _formData: FormData,
): Promise<LogoutActionState> {
  let accessToken: string;
  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      noteFailure("session", "reauth_required");
      return { status: "reauth_required" };
    }
    accessToken = data.session.access_token;
  } catch {
    noteFailure("session", "unexpected_error");
    return { status: "unexpected_error" };
  }

  try {
    // Unlike auth.signOut({ scope: "global" }), this call never invokes
    // GoTrueClient._removeSession() on a remote revocation error.
    const { error } = await supabase.auth.admin.signOut(accessToken, "global");
    if (error) {
      const result = classifyRevocationFailure(error);
      noteFailure("remote", result.status);
      return result;
    }
  } catch (error) {
    const result = classifyRevocationFailure(error);
    noteFailure("remote", result.status);
    return result;
  }

  try {
    await clearLocalAuthSession();
  } catch {
    noteFailure("cookies", "cleanup_incomplete");
    return { status: "cleanup_incomplete" };
  }

  // Next.js redirect throws a control-flow exception: it must not be caught.
  redirect("/login");
}

/**
 * Explicit local-only recovery, safe even when global revocation succeeded.
 * It does not assert or repeat a global revocation based on client state.
 */
export async function finishLocalLogout(
  _previousState: LogoutActionState,
  _formData: FormData,
): Promise<LogoutActionState> {
  try {
    await clearLocalAuthSession();
  } catch {
    noteFailure("local_recovery", "cleanup_incomplete");
    return { status: "cleanup_incomplete" };
  }
  redirect("/login");
}
