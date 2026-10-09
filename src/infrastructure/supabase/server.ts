"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicRuntimeConfig } from "@/core/config";
import { getSupabaseAuthStorageKey } from "./auth-storage";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabasePublishableKey } = getPublicRuntimeConfig();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    auth: { storageKey: getSupabaseAuthStorageKey(supabaseUrl) },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. Proxy handles refreshes.
        }
      },
    },
  });
}
