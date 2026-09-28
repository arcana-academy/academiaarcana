export type PublicRuntimeConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

const PREVIEW_SUPABASE_URL = "https://fichnalpbcfjywwhixid.supabase.co";

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
      : requireValue("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabasePublishableKey: requireValue(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}
