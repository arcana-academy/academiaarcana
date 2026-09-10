import { createBrowserClient } from "@supabase/ssr";

import { getPublicRuntimeConfig } from "@/core/config";

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getPublicRuntimeConfig();

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
