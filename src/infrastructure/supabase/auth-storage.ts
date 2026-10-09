/**
 * Keep the SSR cookie namespace aligned with supabase-js's default storage key.
 * The project's server and session clients explicitly share this value.
 */
export function getSupabaseAuthStorageKey(supabaseUrl: string): string {
  const hostname = new URL(supabaseUrl).hostname;
  return "sb-" + hostname.split(".")[0] + "-auth-token";
}
