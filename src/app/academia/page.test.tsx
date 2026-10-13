import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const testDoubles = vi.hoisted(() => ({
  getSanctuary: vi.fn(async () => ({
    continueLearning: { status: "empty", data: null },
    progress: { status: "empty", data: null },
    missions: { status: "empty", data: null },
    schedule: { status: "empty", data: null },
  })),
  createClient: vi.fn(async () => ({})),
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: testDoubles.createClient,
}));

vi.mock("@/infrastructure/sanctuary/supabase-sanctuary-repository", () => ({
  SupabaseSanctuaryRepository: class {
    readonly isRepository = true;
  },
}));

vi.mock("@/application/sanctuary/get-sanctuary", () => ({
  getSanctuary: testDoubles.getSanctuary,
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
  it("loads its integrated journey with the authenticated user and real module destinations", async () => {
    const html = renderToStaticMarkup(await AcademiaPage());

    expect(testDoubles.createClient).toHaveBeenCalled();
    expect(testDoubles.getSanctuary).toHaveBeenCalledWith(
      expect.objectContaining({ isRepository: true }),
      { user: { id: "user-1" } },
    );
    expect(html).toContain('data-current-path="/academia"');
    expect(html).toContain('id="academia-title"');
    expect(html).toContain('id="academy-journey-title"');
    expect(html).toContain("Criar primeiro grimório");
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
