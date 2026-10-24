import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), pages: vi.fn(), get: vi.fn(),
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
  },
}));
vi.mock("@/infrastructure/supabase/workspace/page-repository", () => ({
  createPageRepository: () => ({ getById: (id: string) => mocks.get(id) }),
}));
vi.mock("@/components/education/OwnedClozePractice", () => ({
  OwnedClozePractice: ({ page }: { page: { id: string; blocks: string[] } }) => (
    <section data-cloze-id={page.id}>{page.blocks.join(" ")}</section>
  ),
}));

import LacunasEstudoPage from "./page";

const props = (page?: string | string[]) => ({
  searchParams: Promise.resolve({ page }),
});

describe("LacunasEstudoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ sub: "owner-a" });
    mocks.pages.mockResolvedValue([
      { id: "a", title: "Anatomia" }, { id: "b", title: "Biologia" },
    ]);
    mocks.get.mockImplementation(async (id: string) => ({
      id, title: "Anatomia",
      content: { type: "document", blocks: [{ type: "paragraph", content: "TEXTO_PRIVADO_PROPRIO" }] },
    }));
  });

  it("authenticates before reading only a catalog member and projects saved text", async () => {
    const html = renderToStaticMarkup(await LacunasEstudoPage(props("a")));
    expect(mocks.auth).toHaveBeenCalledOnce();
    expect(mocks.pages).toHaveBeenCalledWith("owner-a");
    expect(mocks.get).toHaveBeenCalledWith("a");
    expect(html).toContain('data-cloze-id="a"');
    expect(html).toContain("TEXTO_PRIVADO_PROPRIO");
  });

  it("does not fetch content when no page is selected or the ID is foreign or malformed", async () => {
    const initial = renderToStaticMarkup(await LacunasEstudoPage(props()));
    expect(initial).not.toContain("TEXTO_PRIVADO_PROPRIO");
    for (const page of ["foreign", "", ["a", "b"]]) {
      const html = renderToStaticMarkup(await LacunasEstudoPage(props(page)));
      expect(html).toContain("Escolha uma página disponível");
      expect(html).not.toContain("TEXTO_PRIVADO_PROPRIO");
    }
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("distinguishes empty library from outage without leaking internal error details", async () => {
    mocks.pages.mockResolvedValueOnce([]);
    const empty = renderToStaticMarkup(await LacunasEstudoPage(props()));
    expect(empty).toContain("Nenhuma página salva disponível");
    mocks.pages.mockRejectedValueOnce(new Error("PRIVATE_CREDENTIAL"));
    const failure = renderToStaticMarkup(await LacunasEstudoPage(props()));
    expect(failure).toContain("Não foi possível consultar suas páginas");
    expect(failure).not.toContain("Nenhuma página salva disponível");
    expect(failure).not.toContain("PRIVATE_CREDENTIAL");
    expect(failure).toContain('action="/lacunas-estudo"');
  });

  it("fails closed on deleted pages or reading errors", async () => {
    mocks.get.mockResolvedValueOnce(null);
    const missing = renderToStaticMarkup(await LacunasEstudoPage(props("a")));
    expect(missing).toContain("Não foi possível consultar suas páginas");
    mocks.get.mockRejectedValueOnce(new Error("SENSITIVE_UPSTREAM_ERROR"));
    const error = renderToStaticMarkup(await LacunasEstudoPage(props("a")));
    expect(error).not.toContain("SENSITIVE_UPSTREAM_ERROR");
    expect(error).not.toContain('data-cloze-id="a"');
  });

  it("requires authentication before catalog access", async () => {
    mocks.auth.mockRejectedValueOnce(new Error("AUTH_REQUIRED"));
    await expect(LacunasEstudoPage(props("a"))).rejects.toThrow("AUTH_REQUIRED");
    expect(mocks.pages).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
