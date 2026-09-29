import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RelewiseSearch } from "./RelewiseSearch";

describe("RelewiseSearch", () => {
  beforeEach(() => { vi.restoreAllMocks(); });
  it("requires a search term", async () => {
    render(<RelewiseSearch />);
    fireEvent.submit(screen.getByRole("search"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Digite algo para pesquisar.");
  });
  it("renders returned results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [{ productId: "p-1", displayName: "Produto Arcano" }] }), { status: 200, headers: { "Content-Type": "application/json" } })));
    render(<RelewiseSearch />);
    fireEvent.change(screen.getByLabelText("Pesquisar"), { target: { value: "produto" } });
    fireEvent.submit(screen.getByRole("search"));
    expect(await screen.findByText("Produto Arcano")).toBeInTheDocument();
  });
});
