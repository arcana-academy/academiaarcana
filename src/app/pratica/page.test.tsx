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
const pageTwo = { id: "page-2", title: "Anatomia" };

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

const itemTwo = {
  ...itemOne,
  id: "item-2",
  pageId: "page-2",
  pageTitle: "Anatomia",
  prompt: "Explique a anatomia.",
};

const objectiveOne = {
  ...itemOne,
  id: "objective-1",
  prompt: "Qual é a resposta objetiva?",
  evidenceMode: "criterion_exact_match" as const,
  criterion:
    "A resposta deve corresponder à referência após normalização de caixa e espaços.",
  criterionVersion: "1",
  minimumEvidence: 2,
};

const objectiveTwo = {
  ...objectiveOne,
  id: "objective-2",
  pageId: "page-2",
  pageTitle: "Anatomia",
  prompt: "Qual é a estrutura?",
};

describe("PraticaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoryMocks.listPages.mockResolvedValue([pageOne, pageTwo]);
    repositoryMocks.listPracticeItems.mockResolvedValue([
      itemOne,
      objectiveOne,
      itemTwo,
      objectiveTwo,
    ]);
    repositoryMocks.listPracticeAttempts.mockResolvedValue([]);
    repositoryMocks.listObjectiveAssessments.mockResolvedValue([]);
    repositoryMocks.listObjectiveAttempts.mockResolvedValue([]);
  });

  it("renders one valid self-assessment item as the only active activity", async () => {
    const html = renderToStaticMarkup(
      await PraticaPage({
        searchParams: Promise.resolve({ pagina: "page-1", item: "item-1" }),
      }),
    );

    expect(html).toContain('id="practice-session-title"');
    expect(html).not.toContain('id="objective-session-title"');
    expect(html).not.toContain("Resposta de referência.");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("renders one valid objective assessment as the only active activity", async () => {
    const html = renderToStaticMarkup(
      await PraticaPage({
        searchParams: Promise.resolve({
          pagina: "page-1",
          avaliacao: "objective-1",
        }),
      }),
    );

    expect(html).toContain('id="objective-session-title"');
    expect(html).not.toContain('id="practice-session-title"');
    expect(html).not.toContain("Resposta de referência.");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("keeps a canonical page valid with no implicit activity selected", async () => {
    const html = renderToStaticMarkup(
      await PraticaPage({
        searchParams: Promise.resolve({ pagina: "page-1" }),
      }),
    );

    expect(html).toContain("Conteúdo selecionado");
    expect(html).not.toContain('id="practice-session-title"');
    expect(html).not.toContain('id="objective-session-title"');
    expect(html).toContain(
      'href="/workspace?view=tree&amp;page=page-1#current"',
    );
    expect(redirect).not.toHaveBeenCalled();
  });

  it("removes a stale self-assessment selector instead of choosing the first item", async () => {
    await expect(
      PraticaPage({
        searchParams: Promise.resolve({
          pagina: "page-1",
          item: "stale-item",
        }),
      }),
    ).rejects.toThrow("REDIRECT:/pratica?pagina=page-1");

    expect(redirect).toHaveBeenCalledWith("/pratica?pagina=page-1");
  });

  it("removes a stale objective selector instead of choosing the first assessment", async () => {
    await expect(
      PraticaPage({
        searchParams: Promise.resolve({
          pagina: "page-1",
          avaliacao: "stale-assessment",
        }),
      }),
    ).rejects.toThrow("REDIRECT:/pratica?pagina=page-1");

    expect(redirect).toHaveBeenCalledWith("/pratica?pagina=page-1");
  });

  it("rejects a self-assessment item that belongs to another page", async () => {
    await expect(
      PraticaPage({
        searchParams: Promise.resolve({
          pagina: "page-1",
          item: "item-2",
        }),
      }),
    ).rejects.toThrow("REDIRECT:/pratica?pagina=page-1");

    expect(redirect).toHaveBeenCalledWith("/pratica?pagina=page-1");
  });

  it("rejects an objective assessment that belongs to another page", async () => {
    await expect(
      PraticaPage({
        searchParams: Promise.resolve({
          pagina: "page-1",
          avaliacao: "objective-2",
        }),
      }),
    ).rejects.toThrow("REDIRECT:/pratica?pagina=page-1");

    expect(redirect).toHaveBeenCalledWith("/pratica?pagina=page-1");
  });

  it("rejects an objective item passed through the self-assessment selector", async () => {
    await expect(
      PraticaPage({
        searchParams: Promise.resolve({
          pagina: "page-1",
          item: "objective-1",
        }),
      }),
    ).rejects.toThrow("REDIRECT:/pratica?pagina=page-1");

    expect(redirect).toHaveBeenCalledWith("/pratica?pagina=page-1");
  });

  it("rejects a self-assessment item passed through the objective selector", async () => {
    await expect(
      PraticaPage({
        searchParams: Promise.resolve({
          pagina: "page-1",
          avaliacao: "item-1",
        }),
      }),
    ).rejects.toThrow("REDIRECT:/pratica?pagina=page-1");

    expect(redirect).toHaveBeenCalledWith("/pratica?pagina=page-1");
  });

  it("resolves two simultaneously valid selectors as a conflict and returns to page-only", async () => {
    await expect(
      PraticaPage({
        searchParams: Promise.resolve({
          pagina: "page-1",
          item: "item-1",
          avaliacao: "objective-1",
        }),
      }),
    ).rejects.toThrow("REDIRECT:/pratica?pagina=page-1");

    expect(redirect).toHaveBeenCalledWith("/pratica?pagina=page-1");
  });

  it("preserves one valid item while dropping an invalid objective selector", async () => {
    await expect(
      PraticaPage({
        searchParams: Promise.resolve({
          pagina: "page-1",
          item: "item-1",
          avaliacao: "stale-assessment",
        }),
      }),
    ).rejects.toThrow("REDIRECT:/pratica?pagina=page-1&item=item-1");

    expect(redirect).toHaveBeenCalledWith(
      "/pratica?pagina=page-1&item=item-1",
    );
  });

  it("preserves one valid objective assessment while dropping an invalid item selector", async () => {
    await expect(
      PraticaPage({
        searchParams: Promise.resolve({
          pagina: "page-1",
          item: "stale-item",
          avaliacao: "objective-1",
        }),
      }),
    ).rejects.toThrow(
      "REDIRECT:/pratica?pagina=page-1&avaliacao=objective-1",
    );

    expect(redirect).toHaveBeenCalledWith(
      "/pratica?pagina=page-1&avaliacao=objective-1",
    );
  });

  it("redirects a stale page request to the authenticated fallback page and drops subordinate params", async () => {
    await expect(
      PraticaPage({
        searchParams: Promise.resolve({
          pagina: "stale-page",
          item: "item-2",
          avaliacao: "objective-2",
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

  it("canonicalizes stale empty-state params back to /pratica without inventing an activity", async () => {
    repositoryMocks.listPages.mockResolvedValue([]);
    repositoryMocks.listPracticeItems.mockResolvedValue([]);

    await expect(
      PraticaPage({
        searchParams: Promise.resolve({
          pagina: "stale-page",
          item: "stale-item",
          avaliacao: "stale-assessment",
        }),
      }),
    ).rejects.toThrow("REDIRECT:/pratica");

    expect(redirect).toHaveBeenCalledWith("/pratica");
  });

  it("renders the canonical empty Practice state without redirecting", async () => {
    repositoryMocks.listPages.mockResolvedValue([]);
    repositoryMocks.listPracticeItems.mockResolvedValue([]);

    const html = renderToStaticMarkup(
      await PraticaPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(html).toContain("Crie um conteúdo para começar");
    expect(html).toContain('href="/workspace"');
    expect(html).not.toContain("/workspace?view=tree&amp;page=");
    expect(redirect).not.toHaveBeenCalled();
  });
});
