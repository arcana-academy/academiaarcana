import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  pages: vi.fn(),
  items: vi.fn(),
  attempts: vi.fn(),
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mocks.auth,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));
vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/infrastructure/supabase/education/practice-repository", () => ({
  SupabaseEducationalPracticeRepository: class {
    listPages(ownerId: string) { return mocks.pages(ownerId); }
    listPracticeItems(ownerId: string) { return mocks.items(ownerId); }
    listPracticeAttempts(ownerId: string) { return mocks.attempts(ownerId); }
  },
}));

import RevisoesPage from "./page";

describe("RevisoesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ sub: "owner-1" });
    mocks.pages.mockResolvedValue([{ id: "page1", title: "Biologia" }]);
    mocks.items.mockResolvedValue([{
      id: "item1", ownerId: "owner-1", pageId: "page1", pageTitle: "Biologia",
      prompt: "Descreva a célula", referenceAnswer: "Resposta confidencial",
      explanation: null, difficulty: 3, active: true,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    }]);
    mocks.attempts.mockResolvedValue([{
      id: "attempt1", ownerId: "owner-1", practiceItemId: "item1",
      answer: "Tentativa pessoal", outcome: "insufficient",
      evidenceScore: 0.3, confidence: "partial", feedback: "Exemplo",
      createdAt: "2026-09-01T00:00:00.000Z",
    }]);
  });

  it("renders owned recorded reviews with a canonical practice link without answers", async () => {
    const html = renderToStaticMarkup(await RevisoesPage());
    expect(html).toContain('id="revisoes-title"');
    expect(html).toContain('aria-label="Atividades disponíveis para revisão"');
    expect(html).toContain('href="/pratica?pagina=page1&amp;item=item1"');
    expect(html).toContain('href="/sessao-revisao"');
    expect(html).toContain("Descreva a célula");
    expect(html).not.toContain("Resposta confidencial");
    expect(html).not.toContain("Tentativa pessoal");
    expect(mocks.pages).toHaveBeenCalledWith("owner-1");
    expect(mocks.items).toHaveBeenCalledWith("owner-1");
    expect(mocks.attempts).toHaveBeenCalledWith("owner-1");
  });

  it("distinguishes no recorded review from a failed read", async () => {
    mocks.attempts.mockResolvedValue([]);
    const empty = renderToStaticMarkup(await RevisoesPage());
    expect(empty).toContain("Nenhuma revisão disponível neste momento.");
    expect(empty).not.toContain("Não foi possível consultar suas revisões");
    mocks.attempts.mockRejectedValue(new Error("private-auth-host-secret"));
    const failed = renderToStaticMarkup(await RevisoesPage());
    expect(failed).toContain('role="alert"');
    expect(failed).toContain("Não foi possível consultar suas revisões");
    expect(failed).not.toContain("Nenhuma revisão disponível neste momento.");
    expect(failed).not.toContain("private-auth-host-secret");
    expect(failed).toContain('action="/revisoes"');
    expect(failed).toContain('method="get"');
  });

  it("requires authentication before reading any account records", async () => {
    mocks.auth.mockRejectedValue(new Error("AUTH_REQUIRED"));
    await expect(RevisoesPage()).rejects.toThrow("AUTH_REQUIRED");
    expect(mocks.pages).not.toHaveBeenCalled();
    expect(mocks.items).not.toHaveBeenCalled();
    expect(mocks.attempts).not.toHaveBeenCalled();
  });
});
