import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Focus Server Action architecture boundary", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/app/foco/actions.ts"),
    "utf8",
  );

  it("does not access persisted tables directly", () => {
    expect(source).not.toContain(".from(");
    expect(source).not.toContain("SupabaseClient");
  });

  it("delegates behavior to the Planning application service", () => {
    expect(source).toContain('@/application/planning/focus-sessions');
    expect(source).toContain("FocusSessionService");
  });

  it("keeps persistence composition at the infrastructure boundary", () => {
    expect(source).toContain(
      "@/infrastructure/supabase/planning/focus-session-repository",
    );
    expect(source).toContain("SupabaseFocusSessionRepository");
  });
});
