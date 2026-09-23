import type { Page, PageRepository } from "@/domains/learning";

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

type SupabaseClientLike = {
  from: (table: string) => SupabaseQuery;
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

/**
 * Converts a PageRow from the database to a Page domain object.
 * @param row - The database row to convert.
 * @returns The corresponding Page domain object.
 */
const toDomain = (row: PageRow): Page => ({
  id: row.id,
  chapterId: row.chapter_id,
  title: row.title,
  content: row.content,
  position: row.position,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Converts a Page domain object to a PageRow for database operations.
 * @param page - The Page domain object to convert.
 * @returns The corresponding PageRow for database storage.
 */
const toRow = (page: Page): PageRow => ({
  id: page.id,
  chapter_id: page.chapterId,
  title: page.title,
  content: page.content,
  position: page.position,
  created_at: page.createdAt,
  updated_at: page.updatedAt,
});

/**
 * Throws an error if the Supabase query result contains an error.
 * @param result - The result from a Supabase query.
 * @returns The data from the result if no error is present.
 * @throws Error when the result contains an error.
 */
const throwIfError = <T>(result: SupabaseQueryResult<T>): T => {
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
};

export function createPageRepository(
  supabase: SupabaseClientLike,
): PageRepository {
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
