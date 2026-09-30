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
    expect(html).toContain("/assets/grimoires/aa-grimoire-cover-base.svg");
    expect(html).toContain("href=\"/workspace?grimoire=grimoire-1\"");
    expect(listByOwner).toHaveBeenCalledWith("user-1");
  });

  it("shows a clear empty state linked to Workspace", async () => {
    listByOwner.mockResolvedValue([]);

    const html = renderToStaticMarkup(await GrimoriosPage());

    expect(html).toContain("Nenhum grimório ainda");
    expect(html).toContain('href="/workspace"');
  });
});
