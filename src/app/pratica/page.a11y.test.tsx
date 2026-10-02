import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn().mockResolvedValue({ sub: "user-1" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,
}));

vi.mock("@/infrastructure/supabase/education/practice-repository", () => {
  class MockRepository {
    private readonly pages = [{ id: "page-1", title: "Fisiologia" }];

    private readonly items = [
      {
        id: "item-1",
        ownerId: "user-1",
        pageId: "page-1",
        pageTitle: "Fisiologia",
        prompt: "Explique a ideia central.",
        referenceAnswer: "Resposta de referência.",
        explanation: "Revise a relação principal.",
        difficulty: 3,
        active: true,
        evidenceMode: "self_assessment",
        criterion: null,
        criterionVersion: null,
        minimumEvidence: 2,
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
    ];

    listPages() {
      return Promise.resolve(this.pages);
    }

    listPracticeItems() {
      return Promise.resolve(this.items);
    }

    listPracticeAttempts() {
      return Promise.resolve([]);
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
        searchParams: Promise.resolve({ pagina: "page-1", item: "item-1" }),
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
        searchParams: Promise.resolve({ pagina: "page-1", item: "item-1" }),
      }),
    );

    expect(html).not.toContain("Resposta de referência.");
  });
});
