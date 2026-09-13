import { describe, expect, it, vi } from "vitest";

describe("Supabase infrastructure boundaries", () => {
  it("does not expose the server adapter from the browser entrypoint", async () => {
    const browser = await import("./browser");

    expect(browser.createSupabaseBrowserClient).toBeTypeOf("function");
    expect("createSupabaseServerClient" in browser).toBe(false);
    expect("updateSupabaseSession" in browser).toBe(false);
  });

  it("does not evaluate the server adapter in a browser-like environment", async () => {
    vi.stubGlobal("window", {});
    vi.resetModules();

    const browser = await import("./browser");
    expect(browser.createSupabaseBrowserClient).toBeTypeOf("function");

    vi.unstubAllGlobals();
  });
});
