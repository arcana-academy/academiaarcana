import { ConfigurationError } from "@/core/errors";

export type PublicEnv = {
  readonly NEXT_PUBLIC_APP_URL?: string;
};

export type SupabaseServerEnv = {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
};

type EnvSource = Record<string, string | undefined>;

export function getPublicEnv(env: EnvSource): PublicEnv {
  return {
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  };
}

export function getSupabaseServerEnv(env: EnvSource): SupabaseServerEnv {
  const url = env.SUPABASE_URL?.trim();
  const anonKey = env.SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new ConfigurationError(
      "Required server environment configuration is missing.",
    );
  }

  return { SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey };
}
