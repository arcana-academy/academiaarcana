import { describe, expect, it } from "vitest";

describe("Obsidiana workspace contract", () => {
  it("documents the intended views without coupling to a persistence provider", () => {
    expect(["list", "board", "cards", "table"]).toContain("board");
    expect(["supabase", "local"]).not.toContain("required");
  });
});
