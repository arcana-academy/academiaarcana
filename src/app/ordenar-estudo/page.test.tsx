import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), list: vi.fn(), get: vi.fn() }));
vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mocks.auth,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({})) }));
vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/infrastructure/supabase/education/practice-repository", () => ({
  SupabaseEducationalPracticeRepository: class {
    listPages(ownerId: string) { return mocks.list(ownerId); }
  },
}));
vi.mock("@/infrastructure/supabase/workspace/page-repository", () => ({
  createPageRepository: () => ({ getById: (id: string) => mocks.get(id) }),
}));
vi.mock("@/components/education/BlockSequencePractice", () => ({
  BlockSequencePractice: ({ page }: { page: { id: string; blocks: string[] } }) => (
    <section data-sequence-page={page.id}>{page.blocks.join(" ")}</section>
  ),
}));

import OrdenarEstudoPage from "./page";
const props = (page?: string | string[]) => ({ searchParams: Promise.resolve({ page }) });

describe("OrdenarEstudoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ sub: "owner-one" });
    mocks.list.mockResolvedValue([{ id: "own-page", title: "Biologia" }]);
    mocks.get.mockResolvedValue({
      id: "own-page", title: "Biologia",
      content: { type: "document", blocks: [
        { type: "paragraph", content: "CONTEUDO_PRIVADO_DO_PROPRIETARIO_1" },
        { type: "paragraph", content: "CONTEUDO_PRIVADO_DO_PROPRIETARIO_2" },
      ] },
    });
  });

  it("authenticates before selecting and loading only a catalog-owned page", async () => {
    const html = renderToStaticMarkup(await OrdenarEstudoPage(props("own-page")));
    expect(mocks.auth).toHaveBeenCalledOnce();
    expect(mocks.list).toHaveBeenCalledWith("owner-one");
    expect(mocks.get).toHaveBeenCalledExactlyOnceWith("own-page");
    expect(html).toContain('data-sequence-page="own-page"');
    expect(html).toContain("CONTEUDO_PRIVADO_DO_PROPRIETARIO_1");
  });

  it("never reads arbitrary foreign, empty, or array IDs from query input", async () => {
    for (const value of [undefined, "foreign", "", ["own-page", "foreign"]]) {
      const html = renderToStaticMarkup(await OrdenarEstudoPage(props(value)));
      expect(html).not.toContain("CONTEUDO_PRIVADO_DO_PROPRIETARIO_1");
      if (value !== undefined) expect(html).toContain("Escolha uma página disponível");
    }
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("distinguishes actual empty library from a failed read without exposing secrets", async () => {
    mocks.list.mockResolvedValueOnce([]);
    expect(renderToStaticMarkup(await OrdenarEstudoPage(props()))).toContain("Nenhuma página salva");
    mocks.list.mockRejectedValueOnce(new Error("PRIVATE_SERVICE_TOKEN"));
    const failed = renderToStaticMarkup(await OrdenarEstudoPage(props()));
    expect(failed).toContain("Não foi possível consultar suas páginas");
    expect(failed).not.toContain("Nenhuma página salva disponível");
    expect(failed).not.toContain("PRIVATE_SERVICE_TOKEN");
    expect(failed).toContain('action="/ordenar-estudo"');
  });

  it("fails closed on missing page content or repository errors", async () => {
    mocks.get.mockResolvedValueOnce(null);
    const missing = renderToStaticMarkup(await OrdenarEstudoPage(props("own-page")));
    expect(missing).toContain("Não foi possível consultar suas páginas");
    mocks.get.mockRejectedValueOnce(new Error("SECRET_INTERNAL_ERROR"));
    const failed = renderToStaticMarkup(await OrdenarEstudoPage(props("own-page")));
    expect(failed).not.toContain("SECRET_INTERNAL_ERROR");
    expect(failed).not.toContain('data-sequence-page="own-page"');
  });

  it("does not consult the library when session verification fails", async () => {
    mocks.auth.mockRejectedValueOnce(new Error("AUTH_REQUIRED"));
    await expect(OrdenarEstudoPage(props("own-page"))).rejects.toThrow("AUTH_REQUIRED");
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
