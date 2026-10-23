import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

import {
  createContentSecurityPolicy,
  getContentSecurityPolicyHeaderName,
} from "@/lib/security/csp";
import {
  isPrivatePreviewAuthorized,
  isPrivatePreviewEnabled,
} from "@/lib/security/private-preview-gate";
import { updateSession } from "@/lib/supabase/proxy";

function isStaticResource(pathname: string | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp)$/.test(pathname)
  );
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  const isDevelopment = process.env.NODE_ENV === "development";
  const contentSecurityPolicy = createContentSecurityPolicy(nonce, {
    isDevelopment,
  });
  const cspHeaderName = getContentSecurityPolicyHeaderName({ isDevelopment });
  const pathname = request.nextUrl?.pathname;
  const privatePreview = isPrivatePreviewEnabled();

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(cspHeaderName, contentSecurityPolicy);

  // A non-sensitive liveness path remains available for Render monitoring.
  // Every other request, including scripts, images and API routes, is private.
  if (
    privatePreview &&
    pathname !== "/api/health" &&
    !isPrivatePreviewAuthorized(request.headers.get("authorization"))
  ) {
    const denied = NextResponse.json(
      { error: "Prévia privada — autenticação necessária." },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Academia Arcana - Previa", charset="UTF-8"',
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
        },
      },
    );
    denied.headers.set(cspHeaderName, contentSecurityPolicy);
    return denied;
  }

  // Never send the preview-only Basic credential into application handlers.
  if (privatePreview) requestHeaders.delete("authorization");

  // Avoid unnecessary Supabase session refreshes on static resources.
  // The liveness route remains independent of the Auth service.
  const response =
    pathname === "/api/health" || isStaticResource(pathname)
      ? NextResponse.next({ request: { headers: requestHeaders } })
      : await updateSession(request, requestHeaders);
  response.headers.set(cspHeaderName, contentSecurityPolicy);
  if (privatePreview) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
}

export const config = {
  // Full matcher ensures preview authentication also covers generated assets.
  matcher: ["/:path*"],
};
