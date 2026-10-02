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
        assessmentMode: "self-assessment",
        criterionPhrases: [],
        criterionVersion: 1,
        minimumObjectiveAttempts: 1,
        active: true,
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

    listObjectiveEvidences() {
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
