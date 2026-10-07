import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({
    children,
    currentPath,
  }: {
    children: React.ReactNode;
    currentPath: string;
  }) => (
    <div data-current-path={currentPath}>
      {children}
    </div>
  ),
}));

import AcademiaPage from "./page";

describe("AcademiaPage", () => {
  it("requires authentication and groups real learning routes by study step", async () => {
    const html = renderToStaticMarkup(await AcademiaPage());

    expect(html).toContain('data-current-path="/academia"');
    expect(html).toContain('id="academia-title"');
    expect(html).toContain("Organize o conhecimento");
    expect(html).toContain("Planeje e avance");
    expect(html).toContain("Estude e pratique");
    expect(html).toContain("Revise e retome");
    expect(html).toContain('href="/grimorios"');
    expect(html).toContain('href="/workspace"');
    expect(html).toContain('href="/cronograma"');
    expect(html).toContain('href="/missoes"');
    expect(html).toContain('href="/foco"');
    expect(html).toContain('href="/pratica"');
    expect(html).toContain('href="/santuario"');
    expect(html).toContain('href="/estatisticas"');
    expect(html).not.toContain("Ambiente");
    expect(html).not.toContain("Modular");
  });
});
