import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

vi.mock(
  "@/infrastructure/supabase/social/social-repository",
  () => ({
    SupabaseSocialRepository: class {
      async listConnections() {
        return [
          {
            id: "accepted-1",
            requesterId: "user-1",
            recipientId: "user-2",
            status: "accepted",
            createdAt: "2026-10-07T12:00:00.000Z",
            updatedAt: "2026-10-07T12:00:00.000Z",
          },
          {
            id: "incoming-1",
            requesterId: "user-3",
            recipientId: "user-1",
            status: "pending",
            createdAt: "2026-10-07T12:01:00.000Z",
            updatedAt: "2026-10-07T12:01:00.000Z",
          },
          {
            id: "outgoing-1",
            requesterId: "user-1",
            recipientId: "user-4",
            status: "pending",
            createdAt: "2026-10-07T12:02:00.000Z",
            updatedAt: "2026-10-07T12:02:00.000Z",
          },
        ];
      }
    },
  }),
);

import AmigosPage from "./page";

describe("AmigosPage", () => {
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
