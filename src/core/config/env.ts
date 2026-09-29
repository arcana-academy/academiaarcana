export type PublicRuntimeConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

const PROJECT_SUPABASE_URL = "https://fichnalpbcfjywwhixid.supabase.co";
const PROJECT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_0yFN7N7ikHBDY6m6P3FICw_u1lL6ppI";

function resolvePublicValue(name: string, value: string | undefined): string {
  if (value) return value;
  return name === "NEXT_PUBLIC_SUPABASE_URL"
    ? PROJECT_SUPABASE_URL
    : PROJECT_SUPABASE_PUBLISHABLE_KEY;
}

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
  return {
    supabaseUrl: resolvePublicValue(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    supabasePublishableKey: resolvePublicValue(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}
