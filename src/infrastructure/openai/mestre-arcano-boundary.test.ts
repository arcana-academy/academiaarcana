import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Mestre Arcano persistence boundary", () => {
  const toolsSource = readFileSync(
    resolve(process.cwd(), "src/infrastructure/openai/mestre-arcano-tools.ts"),
    "utf8",
  );
  const runtimeSource = readFileSync(
    resolve(process.cwd(), "src/infrastructure/openai/mestre-arcano.ts"),
    "utf8",
  );

  it("keeps Supabase and persistence operations out of the AI tool runtime", () => {
    expect(toolsSource).not.toContain("SupabaseClient");
    expect(toolsSource).not.toContain(".from(");
    expect(runtimeSource).not.toContain("SupabaseClient");
    expect(runtimeSource).not.toContain(".from(");
  });

  it("requires the tool runtime to receive an explicit authorized context", () => {
    expect(toolsSource).toContain("MestreArcanoToolContext");
    expect(runtimeSource).toContain("MestreArcanoToolContext");
  });
});
