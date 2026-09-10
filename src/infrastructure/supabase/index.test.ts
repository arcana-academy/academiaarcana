import { describe, expect, it } from "vitest";

describe("Supabase infrastructure boundary", () => {
  it("exposes the browser, server and session adapters from one public entrypoint", async () => {
    const infrastructure = await import("./index");

    expect(infrastructure.createSupabaseBrowserClient).toBeTypeOf("function");
    expect(infrastructure.createSupabaseServerClient).toBeTypeOf("function");
    expect(infrastructure.updateSupabaseSession).toBeTypeOf("function");
  });
});
