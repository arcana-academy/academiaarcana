import { describe, expect, it } from "vitest";
import * as infrastructure from "./index";

describe("Supabase infrastructure boundary", () => {
  it("exposes the browser, server and session adapters from one public entrypoint", () => {
    expect(infrastructure.createSupabaseBrowserClient).toBeTypeOf("function");
    expect(infrastructure.createSupabaseServerClient).toBeTypeOf("function");
    expect(infrastructure.updateSupabaseSession).toBeTypeOf("function");
  });
});
