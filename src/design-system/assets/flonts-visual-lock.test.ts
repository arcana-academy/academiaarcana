import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Entry = { filename: string; bytes: number; width: number; height: number; sha256: string };
type Manifest = { asset_id: string; integration_state: string; files: Entry[]; master: string; root: string };

const manifest = JSON.parse(readFileSync(
  join(process.cwd(), "docs/visual/FLONTS-VISUAL-LOCK.json"), "utf8",
)) as Manifest;

describe("Flonts identity lock", () => {
  it("uses one fixed approved master and exactly three responsive derivatives", () => {
    expect(manifest.asset_id).toBe("AA-ASSET-013");
    expect(manifest.master).toBe("flonts-mago-original-aprovado.png");
    expect(manifest.files).toHaveLength(4);
    expect(new Set(manifest.files.map((x) => x.filename)).size).toBe(4);
    for (const entry of manifest.files) {
      expect(entry.width * 5).toBeCloseTo(entry.height * 4, 0);
      expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("never silently substitutes artwork whose bytes differ from the approved manifest", () => {
    for (const entry of manifest.files) {
      const location = join(process.cwd(), manifest.root, entry.filename);
      if (!existsSync(location)) continue; // Until the binary-upload checkpoint.
      const file = readFileSync(location);
      expect(file.byteLength, entry.filename).toBe(entry.bytes);
      expect(createHash("sha256").update(file).digest("hex"), entry.filename).toBe(entry.sha256);
    }
  });
});
