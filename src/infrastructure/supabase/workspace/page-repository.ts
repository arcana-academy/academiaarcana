import type {
  Page,
  PageMovementRepository,
  PageRepository,
} from "@/domains/learning";

type SupabaseQueryResult<T> = {
  data: T;
  error: { message: string } | null;
};

type SupabaseQuery = {
  select: (columns?: string) => SupabaseQuery;
  insert: (values: Record<string, unknown>) => SupabaseQuery;
  update: (values: Record<string, unknown>) => SupabaseQuery;
  delete: () => SupabaseQuery;
  eq: (column: string, value: string | number) => SupabaseQuery;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQuery;
  single: () => Promise<SupabaseQueryResult<Record<string, unknown>>>;
  then: (
    resolve: (
      value: SupabaseQueryResult<
        Record<string, unknown> | Record<string, unknown>[] | null
      >,
    ) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

type SupabaseRpcResult = PromiseLike<
  SupabaseQueryResult<Record<string, unknown> | null>
>;

type SupabaseClientLike = {
  from: (table: string) => SupabaseQuery;
  rpc?: (
    functionName: string,
    parameters: Record<string, unknown>,
  ) => SupabaseRpcResult;
};

type PageRow = {
  id: string;
  chapter_id: string;
  title: string;
  content: Page["content"];
  position: number;
  created_at: string;
  updated_at: string;
};

function toDomain(row: PageRow): Page {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    title: row.title,
    content: row.content,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(page: Page): PageRow {
  return {
    id: page.id,
    chapter_id: page.chapterId,
    title: page.title,
    content: page.content,
    position: page.position,
    created_at: page.createdAt,
    updated_at: page.updatedAt,
  };
}

function throwIfError<T>(result: SupabaseQueryResult<T>): T {
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export function createPageRepository(
  supabase: SupabaseClientLike,
): PageRepository & PageMovementRepository {
  return {
    async create(page) {
      const result = await supabase
        .from("pages")
        .insert(toRow(page))
        .select("*")
        .single();

      return toDomain(throwIfError(result) as PageRow);
    },

    async listByChapter(chapterId) {
      const result = await supabase
        .from("pages")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("position", { ascending: true });

      const rows = throwIfError(
        result as SupabaseQueryResult<
          Record<string, unknown> | Record<string, unknown>[]
        >,
      );

      return (rows as PageRow[]).map(toDomain);
    },

    async getById(id) {
      const result = await supabase
        .from("pages")
        .select("*")
        .eq("id", id)
        .single();

      if (result.error) {
        if (result.error.message.toLowerCase().includes("no rows")) {
          return null;
        }

        throw new Error(result.error.message);
      }

      return toDomain(result.data as PageRow);
    },

    async update(id, changes) {
      const values: Record<string, unknown> = {};

      if (changes.chapterId !== undefined) {
        values.chapter_id = changes.chapterId;
      }

      if (changes.title !== undefined) {
        values.title = changes.title;
      }

      if (changes.content !== undefined) {
        values.content = changes.content;
      }

      if (changes.position !== undefined) {
        values.position = changes.position;
      }

      if (changes.updatedAt !== undefined) {
        values.updated_at = changes.updatedAt;
      }

      const result = await supabase
        .from("pages")
        .update(values)
        .eq("id", id)
        .select("*")
        .single();

      return toDomain(throwIfError(result) as PageRow);
    },

    async delete(id) {
      const result = await supabase.from("pages").delete().eq("id", id);

      throwIfError(
        result as SupabaseQueryResult<Record<string, unknown> | null>,
      );
    },

    async move(id, direction) {
      if (!supabase.rpc) {
        throw new Error("Operação de mover página indisponível.");
      }

      const result = await supabase.rpc("move_workspace_page", {
        p_page_id: id,
        p_direction: direction,
      });
      const data = throwIfError(result);

      if (data === null || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Resposta inválida ao mover a página.");
      }

      if (data.moved_page === null && data.swapped_page === null) {
        return null;
      }

      if (
        typeof data.moved_page !== "object" ||
        data.moved_page === null ||
        (data.swapped_page !== null && typeof data.swapped_page !== "object")
      ) {
        throw new Error("Resposta inválida ao mover a página.");
      }

      return {
        movedPage: toDomain(data.moved_page as PageRow),
        swappedPage:
          data.swapped_page === null
            ? null
            : toDomain(data.swapped_page as PageRow),
      };
    },

    async reorder(id, position) {
      const result = await supabase
        .from("pages")
        .update({ position })
        .eq("id", id);

      throwIfError(
        result as SupabaseQueryResult<Record<string, unknown> | null>,
      );
    },
  };
}
