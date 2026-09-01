import { describe, expect, it } from "vitest";
import { createSyncKey, decryptSyncPayload, encryptSyncPayload } from "./crypto";

describe("sync payload encryption", () => {
  it("round-trips through AES-GCM", async () => {
    const raw = new Uint8Array(32);
    raw.fill(7);
    const key = await createSyncKey(raw.buffer);
    const encrypted = await encryptSyncPayload("conteúdo privado", key);
    expect(encrypted.ciphertext).not.toContain("conteúdo privado");
    await expect(decryptSyncPayload(encrypted, key)).resolves.toBe("conteúdo privado");
  });
});
