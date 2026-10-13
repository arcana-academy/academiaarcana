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
vi.mock("@/components/education/GuidedRecallSession", () => ({
  GuidedRecallSession: ({ items }: { items: Array<{ id: string; prompt: string; practiceHref: string }> }) => (
    <section data-guided-recall-ids={items.map((item) => item.id).join(",")}>
      {items.map((item) => <a href={item.practiceHref} key={item.id}>{item.prompt}</a>)}
    </section>
  ),
}));

import SessaoRevisaoPage from "./page";

describe("SessaoRevisaoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ sub: "owner-1" });
    mocks.pages.mockResolvedValue([{ id: "page1", title: "Biologia" }]);
    mocks.items.mockResolvedValue([{
      id: "item1", ownerId: "owner-1", pageId: "page1", pageTitle: "Biologia",
      prompt: "Descreva a célula", referenceAnswer: "SECRETO-REFERENCIA",
      difficulty: 3, active: true, createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    }]);
    mocks.attempts.mockResolvedValue([{
      id: "attempt1", ownerId: "owner-1", practiceItemId: "item1",
      answer: "SECRETO-TENTATIVA", outcome: "insufficient",
      evidenceScore: 0.3, confidence: "partial", feedback: "Rever",
      createdAt: "2026-09-01T00:00:00.000Z",
    }]);
  });

  it("reads only authenticated owned data and renders due prompts without answers", async () => {
    const html = renderToStaticMarkup(await SessaoRevisaoPage());
    expect(mocks.pages).toHaveBeenCalledWith("owner-1");
    expect(mocks.items).toHaveBeenCalledWith("owner-1");
    expect(mocks.attempts).toHaveBeenCalledWith("owner-1");
    expect(html).toContain('data-guided-recall-ids="item1"');
    expect(html).toContain("Descreva a célula");
    expect(html).toContain('href="/pratica?pagina=page1&amp;item=item1"');
    expect(html).not.toContain("SECRETO-REFERENCIA");
    expect(html).not.toContain("SECRETO-TENTATIVA");
  });

  it("shows an honest empty state instead of inventing a session", async () => {
    mocks.attempts.mockResolvedValue([]);
    const html = renderToStaticMarkup(await SessaoRevisaoPage());
    expect(html).toContain("Nenhuma revisão disponível agora");
    expect(html).not.toContain("data-guided-recall-ids");
  });

  it("hides internal errors and offers an accessible retry", async () => {
    mocks.items.mockRejectedValue(new Error("SYNTHETIC_PRIVATE_DB_TOKEN"));
    const html = renderToStaticMarkup(await SessaoRevisaoPage());
    expect(html).toContain("Não foi possível carregar sua sessão");
    expect(html).toContain('role="alert"');
    expect(html).toContain('action="/sessao-revisao"');
    expect(html).not.toContain("SYNTHETIC_PRIVATE_DB_TOKEN");
    expect(html).not.toContain("Nenhuma revisão disponível agora");
  });

  it("rejects unauthenticated access before repository operations", async () => {
    mocks.auth.mockRejectedValue(new Error("AUTH_REQUIRED"));
    await expect(SessaoRevisaoPage()).rejects.toThrow("AUTH_REQUIRED");
    expect(mocks.pages).not.toHaveBeenCalled();
    expect(mocks.items).not.toHaveBeenCalled();
    expect(mocks.attempts).not.toHaveBeenCalled();
  });

  it("filters foreign items and does not leak their prompts", async () => {
    mocks.items.mockResolvedValue([
      { id: "foreign", ownerId: "other", pageId: "page1", prompt: "SEGREDO-OUTRO",
        active: true, difficulty: 3, createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z" },
    ]);
    mocks.attempts.mockResolvedValue([]);
    const html = renderToStaticMarkup(await SessaoRevisaoPage());
    expect(html).not.toContain("SEGREDO-OUTRO");
    expect(html).toContain("Nenhuma revisão disponível agora");
  });
});
