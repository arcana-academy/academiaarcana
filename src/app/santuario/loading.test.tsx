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

    const skeleton = screen.getByTestId("sanctuary-loading-skeleton");

    expect(
      screen.getByTestId("sanctuary-loading-header"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("sanctuary-loading-primary-action"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("sanctuary-loading-areas"),
    ).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
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
      screen.getByTestId("sanctuary-loading-skeleton"),
    ).toBeInTheDocument();
  });
});
