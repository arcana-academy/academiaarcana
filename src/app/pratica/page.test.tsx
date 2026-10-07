import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { repositoryMocks, redirect } = vi.hoisted(() => ({
  repositoryMocks: {
    listPages: vi.fn(),
    listPracticeItems: vi.fn(),
    listPracticeAttempts: vi.fn(),
    listObjectiveAssessments: vi.fn(),
    listObjectiveAttempts: vi.fn(),
  },
  redirect: vi.fn((destination: string): never => {
    throw new Error(`REDIRECT:${destination}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect,
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
    vi.clearAllMocks();
    repositoryMocks.listPages.mockResolvedValue([pageOne]);
    repositoryMocks.listPracticeItems.mockResolvedValue([itemOne]);
    repositoryMocks.listPracticeAttempts.mockResolvedValue([]);
    repositoryMocks.listObjectiveAssessments.mockResolvedValue([]);
    repositoryMocks.listObjectiveAttempts.mockResolvedValue([]);
  });

  it("keeps a valid requested page without redirecting", async () => {
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
    expect(redirect).not.toHaveBeenCalled();
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
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects a stale page request to the authenticated fallback page and drops subordinate params", async () => {
    await expect(
      PraticaPage({
        searchParams: Promise.resolve({
          pagina: "stale-page",
          item: "stale-item",
          avaliacao: "stale-assessment",
        }),
      }),
    ).rejects.toThrow("REDIRECT:/pratica?pagina=page-1");

    expect(redirect).toHaveBeenCalledWith("/pratica?pagina=page-1");
  });

  it("redirects a missing page request to the first authenticated page", async () => {
    await expect(
      PraticaPage({
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("REDIRECT:/pratica?pagina=page-1");

    expect(redirect).toHaveBeenCalledWith("/pratica?pagina=page-1");
  });

  it("keeps the empty Practice state canonical without inventing a page", async () => {
    repositoryMocks.listPages.mockResolvedValue([]);
    repositoryMocks.listPracticeItems.mockResolvedValue([]);

    const html = renderToStaticMarkup(
      await PraticaPage({
        searchParams: Promise.resolve({
          pagina: "stale-page",
          item: "stale-item",
          avaliacao: "stale-assessment",
        }),
      }),
    );

    expect(html).toContain("Crie um conteúdo para começar");
    expect(html).toContain('href="/workspace"');
    expect(html).not.toContain("/workspace?view=tree&amp;page=");
    expect(redirect).not.toHaveBeenCalled();
  });
});
