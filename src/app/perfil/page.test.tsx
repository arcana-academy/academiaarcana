import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: {
            email: "taynara@example.test",
            created_at: "2026-01-15T00:00:00.000Z",
          },
        },
      })),
    },
  })),
}));

vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import PerfilPage from "./page";

describe("PerfilPage", () => {
  it("renders authenticated identity data and privacy entry points", async () => {
    const html = renderToStaticMarkup(await PerfilPage());

    expect(html).toContain("Perfil");
    expect(html).toContain("taynara@example.test");
    expect(html).toContain("15 de janeiro de 2026");
    expect(html).toContain('href="/configuracoes"');
  });
});
