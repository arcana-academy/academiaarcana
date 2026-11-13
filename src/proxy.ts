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

function isCrossOriginMutation(request: NextRequest): boolean {
  if (SAFE_METHODS.has((request.method ?? "GET").toUpperCase())) return false;

  const origin = request.headers.get("origin");
  // Non-browser clients may omit Origin; browsers include it on unsafe methods.
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    if (originUrl.origin === request.nextUrl.origin) return false;

    // Behind a reverse proxy, Next.js can normalize nextUrl to an internal host
    // while the browser's Origin still names the public Host sent to the app.
    // The request Host is part of the actual connection target, unlike Origin.
    const host = request.headers.get("host");
    if (!host) return true;
    const hostOrigin = new URL(`${request.nextUrl.protocol}//${host}`).origin;
    return originUrl.origin !== hostOrigin;
  } catch {
    return true;
  }
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

  // Explicitly isolated personal preview: preserve CSP and origin checks,
  // but do not call real auth/session services or expose application endpoints.
  if (process.env.ARCANA_DEMO_ISOLATED === "1") {
    const noCache = { "Cache-Control": "private, no-store" };
    let isolatedResponse: NextResponse;
    if (pathname === "/api/health") {
      isolatedResponse = NextResponse.next({ request: { headers: requestHeaders } });
    } else if (!isAllowedDemoPath(pathname)) {
      isolatedResponse = new NextResponse(null, { status: 404, headers: noCache });
    } else {
      const expected = readDemoAccessCode();
      if (expected === null) {
        isolatedResponse = new NextResponse("Demo indisponível: credencial runtime ausente.", { status: 503, headers: noCache });
      } else if (!authorizeDemoBasic(request.headers.get("authorization"), expected)) {
        isolatedResponse = new NextResponse("Acesso restrito à demonstração.", {
          status: 401,
          headers: { ...noCache, "WWW-Authenticate": 'Basic realm="Academia Arcana - Demo", charset="UTF-8"' },
        });
      } else if (pathname === "/") {
        isolatedResponse = NextResponse.redirect(new URL("/design-system/pilots/mvp", request.url));
      } else {
        isolatedResponse = NextResponse.next({ request: { headers: requestHeaders } });
      }
    }
    isolatedResponse.headers.set(cspHeaderName, contentSecurityPolicy);
    return isolatedResponse;
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
