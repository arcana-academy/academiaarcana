import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { requireAuthenticatedUser } = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser,
}));

import FocoPage from "./page";

describe("FocoPage", () => {
  it("renders the focus foundation and its real navigation", async () => {
    render(await FocoPage());
    expect(screen.getByRole("heading", { name: "Foco", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Planejar sessão" })).toHaveAttribute("href", "/cronograma");
  });
});
