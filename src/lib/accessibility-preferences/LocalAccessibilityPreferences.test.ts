import { describe, expect, it } from "vitest";

import { createLocalAccessibilityPreferencesRepository } from "./LocalAccessibilityPreferences";

function createStorageMock(): Storage {
  const storage = new Map<string, string>();

  return {
    get length() {
      return storage.size;
    },

    clear() {
      storage.clear();
    },

    getItem(key: string) {
      return storage.get(key) ?? null;
    },

    key(index: number) {
      return Array.from(storage.keys())[index] ?? null;
    },

    removeItem(key: string) {
      storage.delete(key);
    },

    setItem(key: string, value: string) {
      storage.set(key, value);
    },
  };
}

describe("LocalAccessibilityPreferences", () => {
  it("retorna null quando não existe preferência salva", async () => {
    const storage = createStorageMock();

    const repository = createLocalAccessibilityPreferencesRepository(storage);

    await expect(repository.load()).resolves.toBeNull();
  });

  it("salva e recupera preferências versionadas", async () => {
    const storage = createStorageMock();

    const repository = createLocalAccessibilityPreferencesRepository(storage);

    const preferences = {
      version: 1 as const,
      preferences: {
        motion: "reduced" as const,
      },
    };

    await repository.save(preferences);

    await expect(repository.load()).resolves.toEqual(preferences);
  });

  it("ignora dados persistidos inválidos", async () => {
    const storage = createStorageMock();

    storage.setItem(
      "academia-arcana.accessibility-preferences",
      JSON.stringify({
        version: 999,
        preferences: {
          motion: "invalid",
        },
      }),
    );

    const repository = createLocalAccessibilityPreferencesRepository(storage);

    await expect(repository.load()).resolves.toBeNull();
  });
    it("retorna null quando a leitura do armazenamento falha", async () => {
      const storage = createStorageMock();

      storage.getItem = () => {
        throw new Error("storage unavailable");
      };

      const repository = createLocalAccessibilityPreferencesRepository(storage);

      await expect(repository.load()).resolves.toBeNull();
    });

    it("não lança erro quando a gravação do armazenamento falha", async () => {
      const storage = createStorageMock();

      storage.setItem = () => {
        throw new Error("storage unavailable");
      };

      const repository = createLocalAccessibilityPreferencesRepository(storage);

      await expect(
        repository.save({
          version: 1,
          preferences: {
            motion: "reduced",
          },
        }),
      ).resolves.toBeUndefined();
    });
});