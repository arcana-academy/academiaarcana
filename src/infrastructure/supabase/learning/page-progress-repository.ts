import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  PageProgress,
  PageProgressRepository,
  PageProgressStatus,
} from "@/domains/learning";

type PageProgressRow = {
  id: string;
  owner_id: string;
  page_id: string;
  status: PageProgressStatus;
  completed_at: string | null;
  updated_at: string;
};

function toDomain(row: PageProgressRow): PageProgress {
  return {
    id: row.id,
    ownerId: row.owner_id,
    pageId: row.page_id,
    status: row.status,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

export class SupabasePageProgressRepository implements PageProgressRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listByPages(
    ownerId: string,
    pageIds: string[],
  ): Promise<PageProgress[]> {
    if (pageIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from("page_progress")
      .select("*")
      .eq("owner_id", ownerId)
      .in("page_id", pageIds);

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => toDomain(row as PageProgressRow));
  }

  async setStatus(
    ownerId: string,
    pageId: string,
    status: PageProgressStatus,
    completedAt: string | null,
  ): Promise<PageProgress> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("page_progress")
      .upsert(
        {
          owner_id: ownerId,
          page_id: pageId,
          status,
          completed_at: completedAt,
          updated_at: now,
        },
        { onConflict: "owner_id,page_id" },
      )
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return toDomain(data as PageProgressRow);
  }
}
