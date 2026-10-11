// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AsanaConnectionPanel } from "./AsanaConnectionPanel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AsanaConnectionPanel — temporary verification failure", () => {
  it("shows a retry instead of a false disconnected state, then recovers", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        providerId: "asana",
        status: "request_failed",
      }), { status: 502, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        providerId: "asana",
        status: "connected",
        user: { id: "synthetic-user", name: "Synthetic Asana" },
      }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        tasks: [],
      }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", mockFetch);

    render(<AsanaConnectionPanel />);

    expect(await screen.findByRole("heading", {
      name: "Verificação do Asana indisponível",
    })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível consultar o estado do Asana.",
    );
    expect(screen.queryByRole("link", { name: "Conectar Asana" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Reconectar Asana" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Synthetic Asana")).toBeInTheDocument();
    expect(screen.getByText("Conectado")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("still presents reconnection on a confirmed authorization rejection", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ providerId: "asana", status: "reauthorization_required" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    render(<AsanaConnectionPanel />);
    expect(await screen.findByRole("link", { name: "Reconectar Asana" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", {
      name: "Verificação do Asana indisponível",
    })).toBeNull();
  });
});
