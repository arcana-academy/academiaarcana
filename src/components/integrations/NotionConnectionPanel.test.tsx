// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NotionConnectionPanel } from "./NotionConnectionPanel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("NotionConnectionPanel — temporary status failures", () => {
  it("shows retry instead of a false disconnected state and recovers", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ providerId: "notion", status: "request_failed" }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          providerId: "notion",
          status: "connected",
          workspace: { id: "synthetic-workspace", name: "Synthetic Workspace" },
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<NotionConnectionPanel />);

    expect(await screen.findByRole("heading", {
      name: "Verificação do Notion indisponível",
    })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Conectar Notion" })).toBeNull();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível consultar o estado do Notion.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Synthetic Workspace")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/integrations/notion/status", {
      cache: "no-store",
    });
  });
});
