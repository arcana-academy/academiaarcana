import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getPublicRuntimeConfig } from "@/core/config";
import { LOGIN_PATH } from "@/lib/security/private-routes";

export type SessionUpdateOptions = {
  /**
   * When true, a request without verified claims is answered with an immediate
   * redirect to the login route instead of being forwarded to the page. This
   * keeps gated routes from streaming a `200` document before the page-level
   * guard can run.
   */
  readonly requireSession?: boolean;
};

export async function updateSupabaseSession(
  request: NextRequest,
  requestHeaders: Headers = new Headers(request.headers),
  options: SessionUpdateOptions = {},
) {
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const { supabaseUrl, supabasePublishableKey } = getPublicRuntimeConfig();

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request: { headers: requestHeaders } });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();

  if (options.requireSession && (error || !data?.claims?.sub)) {
    // A failed or missing claim check is treated as "not authenticated": the
    // redirect never depends on the reason, so an unavailable Auth service
    // cannot be used to reach a gated page.
    const redirectResponse = NextResponse.redirect(
      new URL(LOGIN_PATH, request.url),
    );

    redirectResponse.headers.set("Cache-Control", "private, no-store");

    return redirectResponse;
  }

  response.headers.set("Cache-Control", "private, no-store");

  return response;
}
