import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";

import {
  createContentSecurityPolicy,
  getContentSecurityPolicyHeaderName,
} from "@/lib/security/csp";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  const isDevelopment = process.env.NODE_ENV === "development";
  const contentSecurityPolicy = createContentSecurityPolicy(nonce, {
    isDevelopment,
  });
  // Development sends the policy as report-only so HMR/Fast Refresh keep
  // working; production always enforces it.
  const cspHeaderName = getContentSecurityPolicyHeaderName({ isDevelopment });

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(cspHeaderName, contentSecurityPolicy);

  const response = await updateSession(request, requestHeaders);
  response.headers.set(cspHeaderName, contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
