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
      {
        id: "item-2",
        ownerId: "user-1",
        pageId: "page-1",
        pageTitle: "Fisiologia",
        prompt: "Qual é a definição exata?",
        referenceAnswer: "Resposta objetiva.",
        explanation: null,
        difficulty: 2,
        active: true,
        evidenceMode: "criterion_exact_match",
        criterion: "A resposta normalizada deve coincidir exatamente com a resposta de referência.",
        criterionVersion: "criterion_exact_match_v1",
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

describe("PraticaPage", () => {
  it("renders native retrieval practice without exposing the reference before an attempt", async () => {
    const html = renderToStaticMarkup(
      await PraticaPage({
        searchParams: Promise.resolve({ pagina: "page-1", item: "item-1" }),
      }),
    );

    expect(html).toContain("Prática e recuperação");
    expect(html).toContain("Recuperação ativa");
    expect(html).toContain("Sua resposta");
    expect(html).toContain("Forte — consegui recuperar");
    expect(html).toContain("Como você avalia esta recuperação?");
    expect(html).not.toContain("Resposta de referência.");
  });
});


describe("PraticaPage objective evidence", () => {
  it("renders criterion-referenced mode without asking for self-assessment", async () => {
    const html = renderToStaticMarkup(
      await PraticaPage({
        searchParams: Promise.resolve({ pagina: "page-1", item: "item-2" }),
      }),
    );

    expect(html).toContain("Avaliação objetiva por correspondência exata");
    expect(html).toContain("A avaliação será calculada automaticamente");
    expect(html).toContain("Avaliar resposta");
    expect(html).not.toContain("Como você avalia esta recuperação?");
    expect(html).not.toContain("Resposta objetiva.");
  });
});
