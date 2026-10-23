import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const images = [
  { file: "public/assets/visual/aa-login-ambiente-approved.webp",
    sha256: "14aae6816718b6d17dd736ab17616d5ba4ee1fb7ffc599b972f5600b14cc9551",
    bytes: 140894, css: "/assets/visual/aa-login-ambiente-approved.webp" },
  { file: "public/assets/visual/aa-sanctuary-ambiente-approved.webp",
    sha256: "7fc277f4c9321af6e3cb8ee7cc330f0c81276cff3178816f12d814e8af873fec",
    bytes: 98102, css: "/assets/visual/aa-sanctuary-ambiente-approved.webp" },
] as const;

describe("C105 approved original artwork (local static assets)", () => {
  it.each(images)("preserves original approved WebP at $file", ({ file, sha256, bytes, css }) => {
    const image = readFileSync(resolve(process.cwd(), file));
    expect(image.length).toBe(bytes);
    expect(image.toString("ascii", 0, 4)).toBe("RIFF");
    expect(image.toString("ascii", 8, 12)).toBe("WEBP");
    expect(createHash("sha256").update(image).digest("hex")).toBe(sha256);
    const styles = readFileSync(resolve(process.cwd(), "src/app/arcana-visual-approved.css"), "utf8");
    expect(styles).toContain(css);
  });
});
