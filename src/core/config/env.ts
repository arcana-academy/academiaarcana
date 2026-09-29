export type PublicRuntimeConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

const PREVIEW_SUPABASE_URL = "https://fichnalpbcfjywwhixid.supabase.co";
const PREVIEW_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_0yFN7N7ikHBDY6m6P3FICw_u1lL6ppI";

function requireValue(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
  const isVercelPreview = process.env.VERCEL_ENV === "preview";

  return {
    supabaseUrl: isVercelPreview
      ? process.env.NEXT_PUBLIC_SUPABASE_URL || PREVIEW_SUPABASE_URL
      : requireValue(
          "NEXT_PUBLIC_SUPABASE_URL",
          process.env.NEXT_PUBLIC_SUPABASE_URL,
        ),
    supabasePublishableKey: isVercelPreview
      ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        PREVIEW_SUPABASE_PUBLISHABLE_KEY
      : requireValue(
          "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        ),
  };
}
