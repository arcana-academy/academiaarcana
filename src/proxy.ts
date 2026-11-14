import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

import {
  createContentSecurityPolicy,
  getContentSecurityPolicyHeaderName,
} from "@/lib/security/csp";
import { isPrivateRoutePath } from "@/lib/security/private-routes";
import { authorizeDemoBasic, isAllowedDemoPath, readDemoAccessCode } from "@/lib/demo/isolated-access";
import { updateSession } from "@/lib/supabase/proxy";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Checks an untrusted Origin against the canonical URL and the public proxy Host. */
function isOutsideOrigin(request: NextRequest, origin: string): boolean {
  try {
    const external = new URL(origin);
    if (external.origin === request.nextUrl.origin) return false;
    const host = request.headers.get("host");
    if (!host) return true;
    const hostOrigin = new URL(`${request.nextUrl.protocol}//${host}`).origin;
    return external.origin !== hostOrigin;
  } catch {
    return true;
  }
}

/** Enforces the existing unsafe-method origin boundary. */
function isCrossOriginMutation(request: NextRequest): boolean {
  if (SAFE_METHODS.has((request.method ?? "GET").toUpperCase())) return false;
  const origin = request.headers.get("origin");
  return origin ? isOutsideOrigin(request, origin) : false;
}

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

/** Denies all real routes and requires a runtime-only secret for this synthetic preview. */
function handleIsolatedPreview(
  request: NextRequest,
  pathname: string,
  requestHeaders: Headers,
): NextResponse {
  const noCache = { "Cache-Control": "private, no-store" };
  if (pathname === "/api/health") return NextResponse.next({ request: { headers: requestHeaders } });
  if (!isAllowedDemoPath(pathname)) return new NextResponse(null, { status: 404, headers: noCache });

  const expected = readDemoAccessCode();
  if (expected === null) {
    return new NextResponse("Demo indisponível: credencial runtime ausente.", { status: 503, headers: noCache });
  }
  if (!authorizeDemoBasic(request.headers.get("authorization"), expected)) {
    return new NextResponse("Acesso restrito à demonstração.", {
      status: 401,
      headers: { ...noCache, "WWW-Authenticate": 'Basic realm="Academia Arcana - Demo", charset="UTF-8"' },
    });
  }
  if (pathname === "/") return NextResponse.redirect(new URL("/design-system/pilots/mvp", request.url));
  return NextResponse.next({ request: { headers: requestHeaders } });
}

/** Preserves the official CSP, nonce and session controls on regular deployments. */
export async function proxy(request: NextRequest) {
  if (isCrossOriginMutation(request)) {
    return NextResponse.json(
      { error: "cross_origin_request_blocked" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

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

  // Preserve nonce and CSP in the independent synthetic-only preview.
  if (process.env.ARCANA_DEMO_ISOLATED === "1") {
    const response = handleIsolatedPreview(request, pathname, requestHeaders);
    response.headers.set(cspHeaderName, contentSecurityPolicy);
    return response;
  }

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
