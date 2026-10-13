import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RelewiseSearch } from "./RelewiseSearch";

describe("RelewiseSearch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires a search term", async () => {
    render(<RelewiseSearch />);

    fireEvent.submit(screen.getByRole("search"));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Digite algo para pesquisar.");
  });

  it("renders returned results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [
              { productId: "p-1", displayName: "Produto Arcano" },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    render(<RelewiseSearch />);
    fireEvent.change(screen.getByRole("textbox", { name: "Pesquisar" }), {
      target: { value: "produto" },
    });
    fireEvent.submit(screen.getByRole("search"));

    expect(await screen.findByText("Produto Arcano")).toBeInTheDocument();
  });

  it("does not report no results before a search is submitted", () => {
    render(<RelewiseSearch />);
    fireEvent.change(screen.getByRole("textbox", { name: "Pesquisar" }), {
      target: { value: "biologia" },
    });
    expect(screen.queryByText("Nenhum resultado encontrado.")).not.toBeInTheDocument();
  });

  it("shows the empty state only after a completed empty search", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    render(<RelewiseSearch />);
    fireEvent.change(screen.getByRole("textbox", { name: "Pesquisar" }), {
      target: { value: "tema inexistente" },
    });
    fireEvent.submit(screen.getByRole("search"));
    expect(await screen.findByRole("status")).toHaveTextContent("Nenhum resultado encontrado.");
  });

  it("clears earlier results when the search term changes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        results: [{ productId: "old", displayName: "Resultado anterior" }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        results: [{ productId: "new", displayName: "Resultado novo" }],
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<RelewiseSearch />);
    const input = screen.getByRole("textbox", { name: "Pesquisar" });
    fireEvent.change(input, { target: { value: "história" } });
    fireEvent.submit(screen.getByRole("search"));
    expect(await screen.findByText("Resultado anterior")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "matemática" } });
    expect(screen.queryByText("Resultado anterior")).not.toBeInTheDocument();
    expect(screen.queryByText("Nenhum resultado encontrado.")).not.toBeInTheDocument();

    fireEvent.submit(screen.getByRole("search"));
    expect(await screen.findByText("Resultado novo")).toBeInTheDocument();
  });

  it("ignores an older search response after a newer search completes", async () => {
    let resolveFirst: ((response: Response) => void) | undefined;
    const firstResponse = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => firstResponse)
      .mockResolvedValueOnce(new Response(JSON.stringify({
        results: [{ productId: "new", displayName: "Busca atual" }],
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<RelewiseSearch />);
    const input = screen.getByRole("textbox", { name: "Pesquisar" });
    fireEvent.change(input, { target: { value: "termo antigo" } });
    fireEvent.submit(screen.getByRole("search"));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: "termo novo" } });
    fireEvent.submit(screen.getByRole("search"));
    expect(await screen.findByText("Busca atual")).toBeInTheDocument();

    await act(async () => {
      resolveFirst?.(new Response(JSON.stringify({
        results: [{ productId: "old", displayName: "Busca antiga" }],
      }), { status: 200 }));
      await firstResponse;
    });

    expect(screen.getByText("Busca atual")).toBeInTheDocument();
    expect(screen.queryByText("Busca antiga")).not.toBeInTheDocument();
  });

});
