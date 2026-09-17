import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Ensures the provided path is a valid next path, defaulting to "/" if invalid.
 * @param value - The path to validate, may be null.
 * @returns A safe path string starting with "/" or "/" if the input is not a valid path.
 */
export function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
function safeNextPath(value: string | null, origin: string): string {
  if (!value || !value.startsWith("/")) {
    return "/";
  }

  const destination = new URL(value, origin);

  if (destination.origin !== origin) {
    return "/";
  }

  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"), requestUrl.origin);

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=auth", requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=auth", requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
