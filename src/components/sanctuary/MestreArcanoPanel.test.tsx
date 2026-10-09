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
    expect(
      document.querySelector('img[src="/assets/intelligence/aa-arcane-core.svg"]'),
    ).toBeInTheDocument();
  });

  it("envia o nível de ajuda somente quando o estudante faz uma escolha explícita", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          output: "Comece por esta pista.",
          responseId: "resp_hint",
          model: "gpt-5.6-sol",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<MestreArcanoPanel />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Quero tentar primeiro. Me dê uma pista sem entregar a resposta.",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Consultar Mestre Arcano" }));

    await screen.findByText("Comece por esta pista.");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/agent/mestre-arcano",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          input: "Quero tentar primeiro. Me dê uma pista sem entregar a resposta.",
          helpLevel: "hint",
        }),
      }),
    );

    fetchMock.mockRestore();
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

  it("remove a resposta anterior quando uma nova consulta falha", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output: "Resposta anterior.",
            responseId: "resp_1",
            model: "gpt-5.6-sol",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Falha temporária." }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }),
      );

    render(<MestreArcanoPanel />);
    const textbox = screen.getByRole("textbox", { name: "Mensagem para o Mestre Arcano" });

    fireEvent.change(textbox, { target: { value: "Primeira pergunta" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar Mestre Arcano" }));
    expect(await screen.findByText("Resposta anterior.")).toBeInTheDocument();

    fireEvent.change(textbox, { target: { value: "Segunda pergunta" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar Mestre Arcano" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha temporária.");
    expect(screen.queryByText("Resposta anterior.")).not.toBeInTheDocument();

    fetchMock.mockRestore();
  });

  it("apresenta erro retornado pela API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ error: "O Mestre Arcano ainda não está configurado no ambiente." }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<MestreArcanoPanel />);

    fireEvent.change(
      screen.getByRole("textbox", { name: "Mensagem para o Mestre Arcano" }),
      { target: { value: "Ajude-me a planejar." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Consultar Mestre Arcano" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O Mestre Arcano ainda não está configurado no ambiente.",
    );

    fetchMock.mockRestore();
  });
});
