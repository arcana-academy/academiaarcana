import type {
  Chapter,
  ChapterRepository,
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
  eq: (
    column: string,
    value: string | number,
  ) => SupabaseQuery;
  order: (
    column: string,
    options?: { ascending?: boolean },
  ) => SupabaseQuery;
  single: () => Promise<
    SupabaseQueryResult<Record<string, unknown>>
  >;
  then: (
    resolve: (
      value: SupabaseQueryResult<
        Record<string, unknown> |
        Record<string, unknown>[] |
        null
      >,
    ) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

type SupabaseClientLike = {
  from: (table: string) => SupabaseQuery;
};

type ChapterRow = {
  id: string;
  notebook_id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
};

(function() {
  function toDomain(row: ChapterRow): Chapter {
    return {
      id: row.id,
      notebookId: row.notebook_id,
      title: row.title,
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function toRow(chapter: Chapter): ChapterRow {
    return {
      id: chapter.id,
      notebook_id: chapter.notebookId,
      title: chapter.title,
      position: chapter.position,
      created_at: chapter.createdAt,
      updated_at: chapter.updatedAt,
    };
  }
  function throwIfError<T>(
    result: SupabaseQueryResult<T>,
  ): T {
    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data;
  }
  window.createChapterRepository = function(
    supabase: SupabaseClientLike,
  ): ChapterRepository {
    return {
      async create(chapter) {
        const result = await supabase
          .from("chapters")
          .insert(toRow(chapter))
          .select("*")
          .single();

        return toDomain(
          throwIfError(result) as ChapterRow,
        );
      },

      async listByNotebook(notebookId) {
        const result = await supabase
          .from("chapters")
          .select("*")
          .eq("notebook_id", notebookId)
          .order("position", { ascending: true });

        const rows = throwIfError(
          result as SupabaseQueryResult<
            Record<string, unknown> |
          
          Record<string, unknown>[]
        >,
      );

      return (rows as ChapterRow[]).map(toDomain);
    },

    async getById(id) {
      const result = await supabase
        .from("chapters")
        .select("*")
        .eq("id", id)
        .single();

      if (result.error) {
        if (
          result.error.message
            .toLowerCase()
            .includes("no rows")
        ) {
          return null;
        }

        throw new Error(result.error.message);
      }

      return toDomain(result.data as ChapterRow);
    },

    async update(id, changes) {
      const values: Record<string, unknown> = {};

      if (changes.notebookId !== undefined) {
        values.notebook_id = changes.notebookId;
      }

      if (changes.title !== undefined) {
        values.title = changes.title;
      }

      if (changes.position !== undefined) {
        values.position = changes.position;
      }

      if (changes.updatedAt !== undefined) {
        values.updated_at = changes.updatedAt;
      }

      const result = await supabase
        .from("chapters")
        .update(values)
        .eq("id", id)
        .select("*")
        .single();

      return toDomain(
        throwIfError(result) as ChapterRow,
      );
    },

    delete: async (id) => {
    delete: async (id) => {
      const result = await supabase
        .from("chapters")
        .delete()
        .eq("id", id);

      throwIfError(
        result as SupabaseQueryResult<
          Record<string, unknown> | null
        >,
      );
    },

    reorder: async (id, position) => {
      const result = await supabase
        .from("chapters")
        .update({ position })
        .eq("id", id);

      throwIfError(
        result as SupabaseQueryResult<
          Record<string, unknown> | null
        >,
      );
    },
  };
}