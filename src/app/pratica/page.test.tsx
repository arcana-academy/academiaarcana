import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  listPages: vi.fn(),
  listPracticeItems: vi.fn(),
  listPracticeAttempts: vi.fn(),
  listObjectiveAssessments: vi.fn(),
  listObjectiveAttempts: vi.fn(),
}));

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
    listPages() {
      return repositoryMocks.listPages();
    }

    listPracticeItems() {
      return repositoryMocks.listPracticeItems();
    }

    listPracticeAttempts() {
      return repositoryMocks.listPracticeAttempts();
    }

    listObjectiveAssessments() {
      return repositoryMocks.listObjectiveAssessments();
    }

    listObjectiveAttempts() {
      return repositoryMocks.listObjectiveAttempts();
    }
  }

  return { SupabaseEducationalPracticeRepository: MockRepository };
});

vi.mock("./actions", () => ({
  createPracticeItemAction: vi.fn(),
  submitPracticeAttemptAction: vi.fn(),
  planPracticeReviewAction: vi.fn(),
  createObjectiveAssessmentAction: vi.fn(),
  submitObjectiveAssessmentAction: vi.fn(),
}));

import PraticaPage from "./page";

const pageOne = { id: "page-1", title: "Fisiologia" };
const itemOne = {
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
};

describe("PraticaPage", () => {
  beforeEach(() => {
    repositoryMocks.listPages.mockResolvedValue([pageOne]);
    repositoryMocks.listPracticeItems.mockResolvedValue([itemOne]);
    repositoryMocks.listPracticeAttempts.mockResolvedValue([]);
    repositoryMocks.listObjectiveAssessments.mockResolvedValue([]);
    repositoryMocks.listObjectiveAttempts.mockResolvedValue([]);
  });

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

  it("returns to the Workspace through the canonical selected-page URL", async () => {
    const html = renderToStaticMarkup(
      await PraticaPage({
        searchParams: Promise.resolve({ pagina: "page-1" }),
      }),
    );

    expect(html).toContain(
      'href="/workspace?view=tree&amp;page=page-1#current"',
    );
  });

  it("uses the real fallback page instead of propagating a stale requested page", async () => {
    const html = renderToStaticMarkup(
      await PraticaPage({
        searchParams: Promise.resolve({ pagina: "stale-page" }),
      }),
    );

    expect(html).toContain(
      'href="/workspace?view=tree&amp;page=page-1#current"',
    );
    expect(html).not.toContain("page=stale-page");
  });

  it("keeps Workspace navigation generic when no page exists", async () => {
    repositoryMocks.listPages.mockResolvedValue([]);
    repositoryMocks.listPracticeItems.mockResolvedValue([]);

    const html = renderToStaticMarkup(
      await PraticaPage({
        searchParams: Promise.resolve({ pagina: "stale-page" }),
      }),
    );

    expect(html).toContain("Crie um conteúdo para começar");
    expect(html).toContain('href="/workspace"');
    expect(html).not.toContain("/workspace?view=tree&amp;page=");
  });
});
