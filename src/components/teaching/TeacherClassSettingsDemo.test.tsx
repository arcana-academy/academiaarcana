import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SETTINGS_AREAS, SETTINGS_STATES, TeacherClassSettingsDemo } from "./TeacherClassSettingsDemo";

describe("Professor → Turma A → Configurações (prévia)", () => {
  it("renders three informational areas without live editing or external links", () => {
    const { container } = render(<TeacherClassSettingsDemo />);
    expect(SETTINGS_AREAS).toHaveLength(4);
    expect(SETTINGS_STATES).toHaveLength(3);
    expect(screen.getByText("3 área(s) de configuração demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    expect(screen.getByText("Identificação e apresentação")).toBeInTheDocument();
    expect(screen.getByText("Acesso à turma")).toBeInTheDocument();
    expect(screen.getByText("Privacidade e proteção")).toBeInTheDocument();
    expect(container.querySelectorAll("a[href], form, input:not([type=search]), textarea")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /salvar|editar|publicar|excluir|convidar|alterar/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Sem salvamento:/)).toBeInTheDocument();
  });

  it("filters by section and proposed status with a useful empty state", () => {
    render(<TeacherClassSettingsDemo />);
    fireEvent.change(screen.getByRole("combobox", { name: "Área de configuração" }), {
      target: { value: "Permissões" },
    });
    expect(screen.getByText("1 área(s) de configuração demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Estado demonstrativo" }), {
      target: { value: "Ilustrativo" },
    });
    expect(screen.getByText("Nenhuma configuração demonstrativa corresponde aos filtros.")).toBeInTheDocument();
  });

  it("filters fields by keyword and discloses permission requirements", () => {
    render(<TeacherClassSettingsDemo />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar configuração demonstrativa" }), {
      target: { value: "Participantes" },
    });
    expect(screen.getByText("1 área(s) de configuração demonstrativa(s) encontrada(s)")).toBeInTheDocument();
    const card = screen.getByText("Acesso à turma").closest("li");
    expect(card).not.toBeNull();
    if (!card) return;
    expect(within(card).getByText("Nenhuma conta de estudante consultada")).toBeInTheDocument();
    expect(within(card).getByText("Requisitos antes de permitir alterações").tagName).toBe("SUMMARY");
    expect(within(card).getByText(/Autorização por turma, revogação, RLS/)).toBeInTheDocument();
  });
});
