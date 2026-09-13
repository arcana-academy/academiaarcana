import { createBrowserClient } from "@supabase/ssr";

import { getPublicRuntimeConfig } from "@/core/config";

export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabasePublishableKey } = getPublicRuntimeConfig();

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
