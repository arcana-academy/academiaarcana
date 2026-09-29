import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MestreArcanoPanel } from "./MestreArcanoPanel";

describe("MestreArcanoPanel", () => {
  it("preenche uma sugestão sem enviar automaticamente", () => {
    render(<MestreArcanoPanel />);

    fireEvent.click(screen.getByRole("button", { name: "O que devo estudar agora?" }));

    expect(
      screen.getByRole("textbox", { name: "Mensagem para o Mestre Arcano" }),
    ).toHaveValue("O que devo estudar agora?");
  });

  it("consulta o agente e apresenta a resposta", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          output: "Comece pelo próximo capítulo pendente e faça uma sessão curta.",
          responseId: "resp_test",
          model: "gpt-5.6-sol",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<MestreArcanoPanel />);

    fireEvent.change(
      screen.getByRole("textbox", { name: "Mensagem para o Mestre Arcano" }),
      { target: { value: "O que estudo agora?" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Consultar Mestre Arcano" }));

    await waitFor(() => {
      expect(
        screen.getByText("Comece pelo próximo capítulo pendente e faça uma sessão curta."),
      ).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/agent/mestre-arcano",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ input: "O que estudo agora?" }),
      }),
    );

    fetchMock.mockRestore();
  });

  it("apresenta erro retornado pela API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "O Mestre Arcano ainda não está configurado no ambiente." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<MestreArcanoPanel />);

    fireEvent.change(
      screen.getByRole("textbox", { name: "Mensagem para o Mestre Arcano" }),
      { target: { value: "Ajude-me a planejar." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Consultar Mestre Arcano" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("O Mestre Arcano ainda não está configurado no ambiente.");

    fetchMock.mockRestore();
  });
});
