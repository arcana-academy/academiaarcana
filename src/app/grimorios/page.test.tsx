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

    const html = renderToStaticMarkup(await GrimoriosPage());

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

    const html = renderToStaticMarkup(await GrimoriosPage());

    expect(html).toContain(
      'href="/workspace?view=tree&amp;grimoire=grimoire%2Fwith%20space#current"',
    );
    expect(html).not.toContain('href="/workspace?grimoire=');
  });

  it("shows a focused empty state with one clear creation action", async () => {
    listByOwner.mockResolvedValue([]);

    const html = renderToStaticMarkup(await GrimoriosPage());

    expect(html).toContain("Nenhum grimório ainda");
    expect(html).toContain("Criar primeiro grimório");
    expect(html).toContain('href="/workspace"');
    expect(html).not.toContain("Próximo passo");
    expect(html).not.toContain("dados vinculados à sua conta");
    expect(html).not.toContain("Novo espaço");
    expect(html).not.toContain("Novo grimório");
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

    const html = renderToStaticMarkup(await GrimoriosPage());

    expect(html).toContain("Sua biblioteca");
    expect(html).toContain(">1 grimório<");
    expect(html).toContain("Novo grimório");
    expect(html).toContain('href="/workspace?view=tree&amp;grimoire=grimoire-1#current"');
  });

  it("does not show an empty count when loading fails and offers a retry", async () => {
    listByOwner.mockRejectedValue(new Error("database unavailable"));

    const html = renderToStaticMarkup(await GrimoriosPage());

    expect(html).toContain("Não foi possível carregar os grimórios");
    expect(html).toContain("Tentar novamente");
    expect(html).toContain('action="/grimorios"');
    expect(html).toContain('type="submit"');
    expect(html).not.toContain("espaços de estudo");
    expect(html).not.toContain("Nenhum grimório ainda");
  });
});
