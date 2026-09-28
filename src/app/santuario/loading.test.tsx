import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => {
    throw new Error("SanctuaryLoading must not create a Supabase client.");
  },
}));

vi.mock("@/infrastructure/sanctuary/supabase-sanctuary-repository", () => ({
  SupabaseSanctuaryRepository: vi.fn().mockImplementation(() => {
    throw new Error(
      "SanctuaryLoading must not build a sanctuary repository.",
    );
  }),
}));

import SanctuaryLoading from "./loading";

describe("SanctuaryLoading", () => {
  it("renders the sanctuary loading structure", () => {
    render(<SanctuaryLoading />);

    const skeletonRegion = document.querySelector(
      ".aa-card-grid[aria-hidden='true']",
    );
    const skeletonCards = document.querySelectorAll(".aa-skeleton-card");

    expect(skeletonCards).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "Carregando o Santuário" }))
      .toBeInTheDocument();
    expect(skeletonRegion).toBeInTheDocument();
  });

  it("exposes accessible loading semantics", () => {
    render(<SanctuaryLoading />);

    expect(screen.getByRole("main")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(
      screen.getByRole("heading", { name: "Carregando o Santuário" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      /carregando|buscando/i,
    );
  });

  it("does not depend on Supabase or the sanctuary repository", () => {
    expect(() => render(<SanctuaryLoading />)).not.toThrow();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders without any props or learning data", () => {
    render(<SanctuaryLoading />);

    expect(SanctuaryLoading.length).toBe(0);
    expect(
      document.querySelectorAll(".aa-skeleton-card"),
    ).toHaveLength(3);
  });
});
