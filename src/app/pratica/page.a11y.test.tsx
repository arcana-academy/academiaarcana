import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/infrastructure/supabase/education/practice-repository", () => {
  class MockRepository {
    async listPages() {
      return [{ id: "page-1", title: "Fisiologia" }];
    }

    async listPracticeItems() {
      return [];
    }

    async listPracticeAttempts() {
      return [];
    }
  }

  return { SupabaseEducationalPracticeRepository: MockRepository };
});

vi.mock("./actions", () => ({
  createPracticeItemAction: vi.fn(),
  submitPracticeAttemptAction: vi.fn(),
  planPracticeReviewAction: vi.fn(),
}));

import PraticaPage from "./page";

describe("PraticaPage accessibility contract", () => {
  it("exposes a labelled structure, associated controls and non-colour-only states", async () => {
    const html = renderToStaticMarkup(
      await PraticaPage({
        searchParams: Promise.resolve({ pagina: "page-1" }),
      }),
    );

    expect(html).toContain('aria-labelledby="practice-title"');
    expect(html).toContain('id="practice-title"');
    expect(html).toContain('for="practice-prompt"');
    expect(html).toContain('for="practice-reference"');
    expect(html).toContain('for="practice-explanation"');
    expect(html).toContain('for="practice-difficulty"');
    expect(html).toContain("<legend>Como você avalia esta recuperação?</legend>");
    expect(html).toContain("Forte — consegui recuperar os pontos essenciais.");
    expect(html).toContain("Parcial — lembrei parte, mas algo importante faltou.");
    expect(html).toContain("Insuficiente — preciso consultar e tentar novamente.");
    expect(html).toContain('aria-label="Navegação educacional"');
  });

  it("keeps the reference answer out of the initial document", async () => {
    const html = renderToStaticMarkup(
      await PraticaPage({
        searchParams: Promise.resolve({ pagina: "page-1" }),
      }),
    );

    expect(html).not.toContain("Resposta de referência");
  });
});
