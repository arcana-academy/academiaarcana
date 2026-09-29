import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

import AmigosPage from "./page";

describe("AmigosPage", () => {
  it("renders privacy-first social states", async () => {
    render(await AmigosPage());
    expect(screen.getByRole("heading", { name: "Amigos", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/nenhuma conexão social persistida/i)).toBeInTheDocument();
  });
});
