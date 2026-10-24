import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

const getUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
  })),
}));

vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import PerfilPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({
    data: {
      user: {
        id: "user-1",
        email: "taynara@example.test",
        created_at: "2026-01-15T00:00:00.000Z",
      },
    },
    error: null,
  });
});

describe("PerfilPage", () => {
  it("renders authenticated identity data and privacy entry points", async () => {
    const html = renderToStaticMarkup(await PerfilPage());

    expect(html).toContain("Perfil");
    expect(html).toContain("taynara@example.test");
    expect(html).toContain("15 de jan. de 2026");
    expect(html).toContain('href="/configuracoes"');
  });
  it("renders a retryable identity warning instead of a user ID when getUser reports an error", async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "private provider failure" },
    });

    const html = renderToStaticMarkup(await PerfilPage());

    expect(html).toContain('role="alert"');
    expect(html).toContain("Não foi possível confirmar os dados da conta");
    expect(html).toContain('action="/perfil"');
    expect(html).toContain('method="get"');
    expect(html).toContain("Tentar novamente");
    expect(html).toContain('href="/academia"');
    expect(html).not.toContain("ID: user-1");
    expect(html).not.toContain("private provider failure");
    expect(html).not.toContain("Conta: E-mail não informado");
  });

  it("rejects a mismatched verified account instead of displaying another identity", async () => {
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: "different-user",
          email: "different@example.test",
          created_at: "2026-01-15T00:00:00.000Z",
        },
      },
      error: null,
    });

    const html = renderToStaticMarkup(await PerfilPage());

    expect(html).toContain('role="alert"');
    expect(html).not.toContain("different@example.test");
    expect(html).not.toContain("ID: user-1");
  });

  it("does not mistake an empty account response for a valid empty email", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: null });

    const html = renderToStaticMarkup(await PerfilPage());

    expect(html).toContain('role="alert"');
    expect(html).not.toContain("E-mail não informado");
  });

  it("handles a thrown profile lookup error without exposing provider messages", async () => {
    getUserMock.mockRejectedValueOnce(new Error("private authentication details"));

    const html = renderToStaticMarkup(await PerfilPage());

    expect(html).toContain('role="alert"');
    expect(html).not.toContain("private authentication details");
  });

  it("distinguishes a valid account with no email from a failed identity lookup", async () => {
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-1",
          email: null,
          created_at: null,
        },
      },
      error: null,
    });

    const html = renderToStaticMarkup(await PerfilPage());

    expect(html).toContain("Conta: E-mail não informado");
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("ID: user-1");
  });

  it("does not swallow authentication or session-client failures", async () => {
    vi.mocked(requireAuthenticatedUser).mockRejectedValueOnce(new Error("auth guard failure"));
    await expect(PerfilPage()).rejects.toThrow("auth guard failure");
    expect(getUserMock).not.toHaveBeenCalled();

    vi.mocked(createClient).mockRejectedValueOnce(new Error("session client failure"));
    await expect(PerfilPage()).rejects.toThrow("session client failure");
    expect(getUserMock).not.toHaveBeenCalled();
  });

});
