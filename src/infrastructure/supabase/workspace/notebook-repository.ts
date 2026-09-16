import type {
  Notebook,
  NotebookRepository,
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

type SupabaseClientLike = {
  from: (table: string) => SupabaseQuery;
};

type NotebookRow = {
  id: string;
  grimoire_id: string;
  title: string;
  description?: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

function toDomain(row: NotebookRow): Notebook {
  return {
    id: row.id,
    grimoireId: row.grimoire_id,
    title: row.title,
    ...(row.description !== null && row.description !== undefined
      ? { description: row.description }
      : {}),
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(notebook: Notebook): NotebookRow {
  return {
    id: notebook.id,
    grimoire_id: notebook.grimoireId,
    title: notebook.title,
    description: notebook.description ?? null,
    position: notebook.position,
    created_at: notebook.createdAt,
    updated_at: notebook.updatedAt,
  };
}

function throwIfError<T>(result: SupabaseQueryResult<T>): T {
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export function createNotebookRepository(
  supabase: SupabaseClientLike,
): NotebookRepository {
  return {
    async create(notebook) {
      const result = await supabase
        .from("notebooks")
        .insert(toRow(notebook))
        .select("*")
        .single();

      return toDomain(throwIfError(result) as NotebookRow);
    },

    async listByGrimoire(grimoireId) {
      const result = await supabase
        .from("notebooks")
        .select("*")
        .eq("grimoire_id", grimoireId)
        .order("position", { ascending: true });

      const rows = throwIfError(
        result as SupabaseQueryResult<
          Record<string, unknown> | Record<string, unknown>[]
        >,
      );

      return (rows as NotebookRow[]).map(toDomain);
    },

    async getById(id) {
      const result = await supabase
        .from("notebooks")
        .select("*")
        .eq("id", id)
        .single();

      if (result.error) {
        if (result.error.message.toLowerCase().includes("no rows")) {
          return null;
        }

        throw new Error(result.error.message);
      }

      return toDomain(result.data as NotebookRow);
    },

    async update(id, changes) {
      const values: Record<string, unknown> = {};

      if (changes.grimoireId !== undefined) {
        values.grimoire_id = changes.grimoireId;
      }

      if (changes.title !== undefined) {
        values.title = changes.title;
      }

      if (changes.description !== undefined) {
        values.description = changes.description;
      }

      if (changes.position !== undefined) {
        values.position = changes.position;
      }

      if (changes.updatedAt !== undefined) {
        values.updated_at = changes.updatedAt;
      }

      const result = await supabase
        .from("notebooks")
        .update(values)
        .eq("id", id)
        .select("*")
        .single();

      return toDomain(throwIfError(result) as NotebookRow);
    },

    async delete(id) {
      const result = await supabase.from("notebooks").delete().eq("id", id);

      throwIfError(
        result as SupabaseQueryResult<Record<string, unknown> | null>,
      );
    },

    async reorder(id, position) {
      const result = await supabase
        .from("notebooks")
        .update({ position })
        .eq("id", id);

      throwIfError(
        result as SupabaseQueryResult<Record<string, unknown> | null>,
      );
    },
  };
}
