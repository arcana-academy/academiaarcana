import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PerfilPage from "./page";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthenticatedUser.mockResolvedValue({ sub: "user-1" });
  mocks.createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "tay@example.com",
            created_at: "2026-01-01T00:00:00.000Z",
          },
        },
        error: null,
      }),
    },
  });
});

describe("PerfilPage", () => {
  it("renders identity from the authenticated user", async () => {
    render(await PerfilPage());

    expect(screen.getByRole("heading", { name: "Perfil", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("tay@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configurações" })).toHaveAttribute("href", "/configuracoes");
  });
});
