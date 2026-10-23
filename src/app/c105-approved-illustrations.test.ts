import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
describe("C105 approved login illustration", () => {
  it("uses exactly the owner-approved local WebP", () => {
    const p = resolve(process.cwd(),"public/assets/visual/aa-login-ambiente-approved.webp");
    const image = readFileSync(p);
    expect(image.length).toBe(140894);
    expect(image.toString("ascii",0,4)).toBe("RIFF");
    expect(image.toString("ascii",8,12)).toBe("WEBP");
    expect(createHash("sha256").update(image).digest("hex")).toBe("14aae6816718b6d17dd736ab17616d5ba4ee1fb7ffc599b972f5600b14cc9551");
    const styles = readFileSync(resolve(process.cwd(),"src/app/arcana-visual-approved.css"),"utf8");
    expect(styles).toContain("/assets/visual/aa-login-ambiente-approved.webp");
  });
});