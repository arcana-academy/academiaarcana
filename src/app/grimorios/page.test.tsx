import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const listByOwner = vi.fn();

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

vi.mock("@/infrastructure/supabase/workspace/grimoire-repository", () => ({
  createGrimoireRepository: vi.fn(() => ({ listByOwner })),
}));

vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({
    children,
    currentPath,
  }: {
    children: React.ReactNode;
    currentPath: string;
  }) => <div data-current-path={currentPath}>{children}</div>,
}));

import GrimoriosPage from "./page";

describe("GrimoriosPage", () => {
  it("requires authentication and lists the user's grimoires", async () => {
    listByOwner.mockResolvedValue([
      {
        id: "grimoire-1",
        ownerId: "user-1",
        title: "Fisiologia",
        description: "Estudos",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);

    const html = renderToStaticMarkup(await GrimoriosPage({}));

    expect(html).toContain('data-current-path="/grimorios"');
    expect(html).toContain("Fisiologia");
    expect(html).toContain("/assets/icons/aa-library-mark.svg");
    expect(html).toContain("/assets/grimoires/aa-grimoire-cover-base.svg");
    expect(html).toContain("href=\"/workspace?view=tree&amp;grimoire=grimoire-1#current\"");
    expect(listByOwner).toHaveBeenCalledWith("user-1");
  });

  it("encodes the authenticated grimoire id in the canonical Workspace handoff", async () => {
    listByOwner.mockResolvedValue([
      {
        id: "grimoire/with space",
        ownerId: "user-1",
        title: "Bioquímica",
        description: null,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);

    const html = renderToStaticMarkup(await GrimoriosPage({}));

    expect(html).toContain(
      'href="/workspace?view=tree&amp;grimoire=grimoire%2Fwith%20space#current"',
    );
    expect(html).not.toContain('href="/workspace?grimoire=');
  });

  it("shows a focused empty state with one clear creation action", async () => {
    listByOwner.mockResolvedValue([]);

    const html = renderToStaticMarkup(await GrimoriosPage({}));

    expect(html).toContain("Nenhum grimório ainda");
    expect(html).toContain("Criar primeiro grimório");
    expect(html).toContain('href="/workspace"');
    expect(html).not.toContain("Próximo passo");
    expect(html).not.toContain("dados vinculados à sua conta");
    expect(html).not.toContain("Novo espaço");
    expect(html).not.toContain("Novo grimório");
    expect(html).not.toContain("Abrir grimório");
    expect(html).not.toContain("&amp;grimoire=");
  });

  it("shows the real list count and a clear action when grimoires exist", async () => {
    listByOwner.mockResolvedValue([
      {
        id: "grimoire-1",
        ownerId: "user-1",
        title: "Fisiologia",
        description: "Estudos",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]);

    const html = renderToStaticMarkup(await GrimoriosPage({}));

    expect(html).toContain("Sua biblioteca");
    expect(html).toContain(">1 grimório<");
    expect(html).toContain("Novo grimório");
    expect(html).toContain('href="/workspace?view=tree&amp;grimoire=grimoire-1#current"');
  });

  it("does not show an empty count when loading fails and offers a retry", async () => {
    listByOwner.mockRejectedValue(new Error("database unavailable"));

    const html = renderToStaticMarkup(await GrimoriosPage({}));

    expect(html).toContain("Não foi possível carregar os grimórios");
    expect(html).toContain("Tentar novamente");
    expect(html).toContain('action="/grimorios"');
    expect(html).toContain('type="submit"');
    expect(html).not.toContain("espaços de estudo");
    expect(html).not.toContain("Nenhum grimório ainda");
    expect(html).not.toContain("Abrir grimório");
    expect(html).not.toContain("&amp;grimoire=");
  });
  it("filters owned grimoires by title, ignoring case and accents", async () => {
    listByOwner.mockResolvedValue([
      { id: "g-1", title: "Bioquímica", description: "Metabolismo" },
      { id: "g-2", title: "Fisiologia", description: "Sistemas do corpo" },
    ]);

    const html = renderToStaticMarkup(await GrimoriosPage({
      searchParams: Promise.resolve({ q: "  BIOQUIMICA  " }),
    }));

    expect(html).toContain("Bioquímica");
    expect(html).not.toContain("Fisiologia");
    expect(html).toContain("1 resultado de 2 grimórios");
    expect(html).toContain('role="search"');
    expect(html).toContain('name="q"');
    expect(html).toContain('href="/grimorios"');
    expect(listByOwner).toHaveBeenCalledWith("user-1");
  });

  it("also searches descriptions without creating a second data source", async () => {
    listByOwner.mockResolvedValue([
      { id: "g-1", title: "Anatomia", description: "Sistema nervoso" },
      { id: "g-2", title: "História", description: null },
    ]);

    const html = renderToStaticMarkup(await GrimoriosPage({
      searchParams: Promise.resolve({ q: "NERVOso" }),
    }));

    expect(html).toContain("Anatomia");
    expect(html).not.toContain("História");
    expect(html).toContain("1 resultado de 2 grimórios");
  });

  it("distinguishes no matching results from an empty library", async () => {
    listByOwner.mockResolvedValue([{ id: "g-1", title: "Física", description: null }]);

    const html = renderToStaticMarkup(await GrimoriosPage({
      searchParams: Promise.resolve({ q: "química" }),
    }));

    expect(html).toContain("Nenhum grimório corresponde à busca");
    expect(html).toContain("0 resultados de 1 grimório");
    expect(html).not.toContain("Nenhum grimório ainda");
    expect(html).not.toContain("Abrir grimório");
    expect(html).toContain("Limpar busca");
  });

  it("ignores malformed multi-value queries and trims whitespace-only queries", async () => {
    listByOwner.mockResolvedValue([
      { id: "g-1", title: "Primeiro", description: null },
      { id: "g-2", title: "Segundo", description: null },
    ]);

    const multi = renderToStaticMarkup(await GrimoriosPage({
      searchParams: Promise.resolve({ q: ["Primeiro", "Segundo"] }),
    }));
    const blank = renderToStaticMarkup(await GrimoriosPage({
      searchParams: Promise.resolve({ q: "   " }),
    }));

    for (const html of [multi, blank]) {
      expect(html).toContain("Primeiro");
      expect(html).toContain("Segundo");
      expect(html).not.toContain("Limpar busca");
    }
  });

  it("does not turn an owner read error into a false search-empty state", async () => {
    listByOwner.mockRejectedValue(new Error("sensitive database exception"));

    const html = renderToStaticMarkup(await GrimoriosPage({
      searchParams: Promise.resolve({ q: "estudo" }),
    }));

    expect(html).toContain("Não foi possível carregar os grimórios");
    expect(html).not.toContain("Nenhum grimório corresponde");
    expect(html).not.toContain("sensitive database exception");
  });

});
