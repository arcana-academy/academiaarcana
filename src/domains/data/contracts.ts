/**
 * Foundational persistence contracts for the data domain.
 *
 * Concrete entities, repositories and database mappings are introduced only
 * when their domain requirements are defined.
 */

export type PersistenceId = string & {
  readonly __brand: "PersistenceId";
};

export type PersistenceMetadata = {
  id: PersistenceId;
  createdAt: string;
  updatedAt: string;
  version: number;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createPersistenceId(value: string): PersistenceId {
  if (!UUID_PATTERN.test(value)) {
    throw new Error("Invalid persistence identifier");
  }

  return value as PersistenceId;
}
