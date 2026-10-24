import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ApiRateLimitBucket,
  ApiRateLimitPort,
  ApiRateLimitQuota,
} from "@/application/security/api-rate-limit";

const RATE_LIMIT_RPC = "consume_api_rate_limit";

type RateLimitRow = {
  allowed: boolean | null;
  remaining: number | null;
  retry_after_seconds: number | null;
};

/**
 * Reads the quota from the database rather than from process memory: the limit
 * survives restarts and is shared by every instance of the service.
 */
export class SupabaseApiRateLimitRepository implements ApiRateLimitPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async consume(bucket: ApiRateLimitBucket): Promise<ApiRateLimitQuota> {
    const { data, error } = await this.supabase.rpc(RATE_LIMIT_RPC, {
      p_bucket: bucket,
    });

    if (error) {
      throw new Error(
        `Não foi possível verificar o limite de uso (${bucket}): ${error.message}`,
      );
    }

    const row = Array.isArray(data) ? (data[0] as RateLimitRow | undefined) : undefined;

    if (
      !row ||
      typeof row.allowed !== "boolean" ||
      typeof row.remaining !== "number" ||
      typeof row.retry_after_seconds !== "number"
    ) {
      throw new Error(
        `Resposta inválida do limite de uso (${bucket}).`,
      );
    }

    return {
      allowed: row.allowed,
      remaining: Math.max(row.remaining, 0),
      retryAfterSeconds: Math.max(row.retry_after_seconds, 0),
    };
  }
}
