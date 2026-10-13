import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  pages: vi.fn(),
  get: vi.fn(),
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
  createPageRepository: () => ({
    getById: (id: string) => mocks.get(id),
  }),
}));
vi.mock("@/components/education/ActiveConceptComparison", () => ({
  ActiveConceptComparison: ({ pages }: { pages: Array<{ id: string; blocks: string[] }> }) => (
    <section data-comparison-ids={pages.map((page) => page.id).join(",")}>
      {pages.flatMap((page) => page.blocks.map((text, i) => <p key={page.id + i}>{text}</p>))}
    </section>
  ),
}));

import CompararConceitosPage from "./page";

const params = (a?: string, b?: string) => ({ searchParams: Promise.resolve({ a, b }) });

describe("CompararConceitosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ sub: "owner" });
    mocks.pages.mockResolvedValue([
      { id: "one", title: "Biologia" },
      { id: "two", title: "Química" },
    ]);
    mocks.get.mockImplementation(async (id: string) => ({
      id, title: id === "one" ? "Biologia" : "Química",
      content: { type: "document", blocks: [{ type: "paragraph", content: "SAVED-TEXT-" + id }] },
    }));
  });

  it("authenticates before reading and only loads selected catalog members", async () => {
    const html = renderToStaticMarkup(await CompararConceitosPage(params("one", "two")));
    expect(mocks.pages).toHaveBeenCalledWith("owner");
    expect(mocks.get).toHaveBeenCalledTimes(2);
    expect(mocks.get).toHaveBeenCalledWith("one");
    expect(mocks.get).toHaveBeenCalledWith("two");
    expect(html).toContain('data-comparison-ids="one,two"');
    expect(html).toContain("SAVED-TEXT-one");
    expect(html).not.toContain("SAVED-TEXT-other");
  });

  it("does not look up foreign, missing or duplicate ids", async () => {
    for (const [a, b] of [
      ["foreign", "two"], ["one", "one"], ["one", undefined],
    ] as const) {
      const html = renderToStaticMarkup(await CompararConceitosPage(params(a, b)));
      expect(html).toContain("Escolha duas páginas diferentes");
      expect(html).not.toContain("data-comparison-ids");
    }
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("shows a true empty state separately from an outage", async () => {
    mocks.pages.mockResolvedValueOnce([]);
    const empty = renderToStaticMarkup(await CompararConceitosPage(params()));
    expect(empty).toContain("São necessárias duas páginas salvas");
    mocks.pages.mockRejectedValueOnce(new Error("SECRET_DATABASE_DSN"));
    const failed = renderToStaticMarkup(await CompararConceitosPage(params()));
    expect(failed).toContain("Não foi possível ler suas páginas");
    expect(failed).not.toContain("São necessárias duas páginas salvas");
    expect(failed).not.toContain("SECRET_DATABASE_DSN");
  });

  it("keeps content unloaded until selection and requires auth before any repository use", async () => {
    const html = renderToStaticMarkup(await CompararConceitosPage(params()));
    expect(html).not.toContain("SAVED-TEXT-one");
    expect(mocks.get).not.toHaveBeenCalled();
    mocks.auth.mockRejectedValue(new Error("AUTH_REQUIRED"));
    await expect(CompararConceitosPage(params("one", "two"))).rejects.toThrow("AUTH_REQUIRED");
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("fails closed if the selected page disappears or read fails", async () => {
    mocks.get.mockResolvedValueOnce(null);
    const missing = renderToStaticMarkup(await CompararConceitosPage(params("one", "two")));
    expect(missing).toContain("Não foi possível ler suas páginas");
    mocks.get.mockRejectedValueOnce(new Error("PRIVATE-DETAIL"));
    const failed = renderToStaticMarkup(await CompararConceitosPage(params("one", "two")));
    expect(failed).not.toContain("PRIVATE-DETAIL");
    expect(failed).toContain('role="alert"');
  });
});
