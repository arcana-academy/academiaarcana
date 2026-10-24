import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const { listConnectionsMock } = vi.hoisted(() => ({ listConnectionsMock: vi.fn() }));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

vi.mock("@/infrastructure/supabase/social/social-repository", () => ({
  SupabaseSocialRepository: vi.fn(function SupabaseSocialRepository() {
    return { listConnections: listConnectionsMock };
  }),
}));

import AmigosPage from "./page";

describe("AmigosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ sub: "user-1" } as Awaited<ReturnType<typeof requireAuthenticatedUser>>);
    listConnectionsMock.mockResolvedValue([
          { id: "accepted-1", requesterId: "user-1", recipientId: "user-2", status: "accepted", createdAt: "2026-10-07T12:00:00.000Z", updatedAt: "2026-10-07T12:00:00.000Z" },
          { id: "incoming-1", requesterId: "user-3", recipientId: "user-1", status: "pending", createdAt: "2026-10-07T12:01:00.000Z", updatedAt: "2026-10-07T12:01:00.000Z" },
          { id: "outgoing-1", requesterId: "user-1", recipientId: "user-4", status: "pending", createdAt: "2026-10-07T12:02:00.000Z", updatedAt: "2026-10-07T12:02:00.000Z" },
        ]);
  });

  it("provides an accessible retry instead of pretending the social network is empty on read outage", async () => {
    listConnectionsMock.mockRejectedValueOnce(new Error("private-backend-details"));
    render(await AmigosPage());
    expect(screen.getByRole("alert")).toHaveAttribute("aria-labelledby", "friends-unavailable-title");
    expect(screen.getByRole("heading", { name: "Não foi possível carregar suas conexões" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toHaveAttribute("type", "submit");
    expect(document.querySelector('form[action="/amigos"][method="get"]')).toBeInTheDocument();
    expect(screen.queryByText("Nenhuma amizade aceita ainda.")).not.toBeInTheDocument();
    expect(screen.queryByText("Nenhuma solicitação recebida pendente.")).not.toBeInTheDocument();
    expect(screen.queryByText("Nenhuma solicitação enviada pendente.")).not.toBeInTheDocument();
    expect(screen.queryByText(/private-backend-details/)).not.toBeInTheDocument();
    expect(listConnectionsMock).toHaveBeenCalledWith("user-1");
  });

  it("preserves authentication failure rather than hiding it as a social read outage", async () => {
    vi.mocked(requireAuthenticatedUser).mockRejectedValueOnce(new Error("authentication required"));
    await expect(AmigosPage()).rejects.toThrow("authentication required");
    expect(listConnectionsMock).not.toHaveBeenCalled();
  });

  it("preserves true empty state when the read succeeds", async () => {
    listConnectionsMock.mockResolvedValueOnce([]);
    render(await AmigosPage());
    expect(screen.getByText("Nenhuma amizade aceita ainda.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders relationship counts without identities or actions that require them", async () => {
    render(await AmigosPage());

    expect(
      screen.getByRole("heading", { name: "Amigos", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 amizade aceita")).toBeInTheDocument();
    expect(screen.getByText("1 solicitação pendente")).toBeInTheDocument();
    expect(
      screen.getByText("1 solicitação aguardando resposta"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/user-[234]/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(3);
    expect(
      screen.getAllByText(
        "Ações indisponíveis até que esta conexão possa ser identificada com segurança.",
      ),
    ).toHaveLength(3);
    expect(
      screen.queryByRole("button", {
        name: /remover amizade|aceitar|recusar|cancelar solicitação/i,
      }),
    ).not.toBeInTheDocument();
  });
});
