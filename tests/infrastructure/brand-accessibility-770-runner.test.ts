import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const runner = readFileSync(resolve("scripts/security/test-local-authenticated-nextjs-e2e.mjs"), "utf8");
const scenario = readFileSync(resolve("tests/e2e/brand-accessibility-770.spec.ts"), "utf8");

describe("AA770 — execução autenticada apenas no Supabase sintético local", () => {
  it("não deixa a regressão de acessibilidade fora do executor autenticado oficial", () => {
    expect(runner).toContain('"tests/e2e/brand-accessibility-770.spec.ts"');
    expect(runner).toContain('"tests/e2e/grimoires-workspace.spec.ts"');
    expect(runner).toContain("--config=playwright.local-auth.config.ts");
  });

  it("preserva as guardas de PR, localhost e HTTPS em ambas as camadas", () => {
    for (const guard of [
      'process.env.GITHUB_ACTIONS',
      'process.env.GITHUB_EVENT_NAME',
      'process.env.AA_LOCAL_SUPABASE_E2E',
    ]) {
      expect(runner).toContain(guard);
      expect(scenario).toContain(guard);
    }
    expect(runner).toContain('assert.equal(api.protocol, "http:"');
    expect(runner).toContain('NEXT_PUBLIC_SUPABASE_URL: "https://127.0.0.1:"');
    expect(scenario).toContain('url.protocol === "https:"');
    expect(scenario).toContain('"127.0.0.1"');
  });

  it("não converte seleção de papel em operação no banco ou bypass de autenticação", () => {
    expect(scenario).toContain('getByRole("combobox", { name: "Estilo do papel desta página" })');
    expect(scenario).toContain("page.reload()");
    expect(scenario).toContain("Conteúdo sintético protegido");
    expect(scenario).not.toMatch(/service_role|supabaseAdmin|auth\.admin/i);
  });
});
