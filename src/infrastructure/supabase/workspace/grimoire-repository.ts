import type {
  Grimoire,
  GrimoireRepository,
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

type GrimoireRow = {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  cover?: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Converts a database row to a Grimoire domain object.
 * @param row The GrimoireRow to convert.
 * @returns A Grimoire domain object.
 */
const toDomain = (row: GrimoireRow): Grimoire => {
  const optionalFields: Array<[keyof GrimoireRow, keyof Grimoire]> = [
    ['description', 'description'],
    ['icon', 'icon'],
    ['cover', 'cover'],
  ];
  const optional = optionalFields.reduce((acc, [src, dest]) => {
    const value = row[src];
    if (value != null) {
      (acc as any)[dest] = value;
    }
    return acc;
  }, {} as Partial<Grimoire>);
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    ...optional,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Converts a Grimoire domain object to a database row.
 * @param grimoire The Grimoire domain object to convert.
 * @returns A GrimoireRow for database storage.
 */
const toRow = (grimoire: Grimoire): GrimoireRow => {
  return {
    id: grimoire.id,
    owner_id: grimoire.ownerId,
    title: grimoire.title,
    description: grimoire.description ?? null,
    icon: grimoire.icon ?? null,
    cover: grimoire.cover ?? null,
    created_at: grimoire.createdAt,
    updated_at: grimoire.updatedAt,
  };
};

/**
 * Throws an error if the Supabase query result has an error.
 * @param result The result of a Supabase query.
 * @returns The data from the query result.
 * @throws Error if the query result contains an error.
 */
const throwIfError = <T>(
  result: SupabaseQueryResult<T>,
): T => {
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
};

export function createGrimoireRepository(
  supabase: SupabaseClientLike,
): GrimoireRepository {
  return {
    async create(grimoire) {
      const result = await supabase
        .from("grimoires")
        .insert(toRow(grimoire))
        .select("*")
        .single();

      return toDomain(
        throwIfError(result) as GrimoireRow,
      );
    },

    async getById(id) {
      const result = await supabase
        .from("grimoires")
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

      return toDomain(
        result.data as GrimoireRow,
      );
    },

    async listByOwner(ownerId) {
      const result = await supabase
        .from("grimoires")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", {
          ascending: true,
        });

      const rows = throwIfError(
        result as SupabaseQueryResult<
          Record<string, unknown> |
          Record<string, unknown>[]
        >,
      );

      return (rows as GrimoireRow[]).map(toDomain);
    },

    async update(id, changes) {
      const values: Record<string, unknown> = {};

      if (changes.ownerId !== undefined) {
        values.owner_id = changes.ownerId;
      }

      if (changes.title !== undefined) {
        values.title = changes.title;
      }

      if (changes.description !== undefined) {
        values.description = changes.description;
      }

      if (changes.icon !== undefined) {
        values.icon = changes.icon;
      }

      if (changes.cover !== undefined) {
        values.cover = changes.cover;
      }

      if (changes.updatedAt !== undefined) {
        values.updated_at = changes.updatedAt;
      }

      const result = await supabase
        .from("grimoires")
        .update(values)
        .eq("id", id)
        .select("*")
        .single();

      return toDomain(
        throwIfError(result) as GrimoireRow,
      );
    },

    async delete(id) {
      const result = await supabase
        .from("grimoires")
        .delete()
        .eq("id", id);

      throwIfError(
        result as SupabaseQueryResult<
          Record<string, unknown> | null
        >,
      );
    },
  };
}