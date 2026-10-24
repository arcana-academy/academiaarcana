import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

import {
  createContentSecurityPolicy,
  getContentSecurityPolicyHeaderName,
} from "@/lib/security/csp";
import { isPrivateRoutePath } from "@/lib/security/private-routes";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Resolves the request pathname without ever throwing.
 *
 * Next.js always provides `nextUrl` on a middleware request; the fallbacks keep
 * the proxy from crashing on a malformed request. An unresolvable path is
 * treated as public, and the page-level guard still protects its data.
 */
function resolvePathname(request: NextRequest): string {
  const fromNextUrl = request.nextUrl?.pathname;

  if (typeof fromNextUrl === "string" && fromNextUrl.length > 0) {
    return fromNextUrl;
  }

  try {
    return new URL(request.url).pathname;
  } catch {
    return "/";
  }
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  const pathname = resolvePathname(request);
  const isDevelopment = process.env.NODE_ENV === "development";
  const contentSecurityPolicy = createContentSecurityPolicy(nonce, {
    isDevelopment,
  });
  // Development sends the policy as report-only so HMR/Fast Refresh keep
  // working; production always enforces it.
  const cspHeaderName = getContentSecurityPolicyHeaderName({ isDevelopment });

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(cspHeaderName, contentSecurityPolicy);

  // Liveness must not depend on an external Auth session refresh.
  // Keep the CSP/nonce flow unchanged; readiness and protected routes still validate sessions.
  // Gated routes resolve their session here, before the streamed shell can be
  // flushed, so anonymous visitors receive a real 307 instead of a 200 document.
  const response =
    pathname === "/api/health"
      ? NextResponse.next({ request: { headers: requestHeaders } })
      : await updateSession(request, requestHeaders, {
          requireSession: isPrivateRoutePath(pathname),
        });
  response.headers.set(cspHeaderName, contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
