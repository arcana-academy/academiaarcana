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
      return [{
        id: "item-1",
        ownerId: "user-1",
        pageId: "page-1",
        pageTitle: "Fisiologia",
        prompt: "Explique a ideia central.",
        referenceAnswer: "Resposta de referência.",
        explanation: "Revise a relação principal.",
        difficulty: 3,
        active: true,
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
      }];
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
    expect(html).not.toContain("Resposta de referência.");
  });
});
