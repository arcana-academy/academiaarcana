export type PublicRuntimeConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

// These are public Supabase runtime values (the publishable key is intentionally browser-safe).
// Environment variables still take precedence when configured in Vercel or locally.
const DEFAULT_SUPABASE_URL = "https://fichnalpbcfjywwhixid.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_0yFN7N7ikHBDY6m6P3FICw_u1lL6ppI";

function requireValue(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
  const vercelEnvironment = process.env.VERCEL_ENV;
  const useSafeVercelFallback = vercelEnvironment === "preview" || vercelEnvironment === "production";

  return {
    supabaseUrl:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      (useSafeVercelFallback
        ? DEFAULT_SUPABASE_URL
        : requireValue("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL)),
    supabasePublishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      (useSafeVercelFallback
        ? DEFAULT_SUPABASE_PUBLISHABLE_KEY
        : requireValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)),
  };
}
