import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MATERIAL_CATEGORIES, TeacherMaterialsDemo } from "./TeacherMaterialsDemo";

describe("Professor → Turma A → Conteúdos e Materiais (prévia)", () => {
  it("displays three fictitious resources with no file links or write controls", () => {
    const { container } = render(<TeacherMaterialsDemo />);
    expect(screen.getByText("3 material(is) demonstrativo(s) encontrado(s)")).toBeInTheDocument();
    expect(screen.getByText("Guia de Boas-vindas (fictício)")).toBeInTheDocument();
    expect(screen.getByText("Mapa dos Grimórios (fictício)")).toBeInTheDocument();
    expect(screen.getByText("Slides de Práticas Arcanas (fictício)")).toBeInTheDocument();
    expect(container.querySelectorAll("a[href]")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /baixar|editar|publicar|excluir|compartilhar|criar/i })).not.toBeInTheDocument();
  });

  it("filters by category and status without requesting external data", () => {
    render(<TeacherMaterialsDemo />);
    expect(MATERIAL_CATEGORIES).toHaveLength(4);
    fireEvent.change(screen.getByRole("combobox", { name: "Categoria de material" }), {
      target: { value: "Grimórios" },
    });
    expect(screen.getByText("1 material(is) demonstrativo(s) encontrado(s)")).toBeInTheDocument();
    expect(screen.queryByText("Guia de Boas-vindas (fictício)")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Situação do material" }), {
      target: { value: "Em preparação" },
    });
    expect(screen.getByText("Nenhum material demonstrativo corresponde aos filtros.")).toBeInTheDocument();
  });

  it("supports text search, a clean empty state and native details disclosure", () => {
    render(<TeacherMaterialsDemo />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar material demonstrativo" }), {
      target: { value: "práticas arcanas" },
    });
    const item = screen.getByText("Slides de Práticas Arcanas (fictício)").closest("li");
    expect(item).not.toBeNull();
    if (!item) return;
    expect(within(item).getByText("Ver informações demonstrativas").tagName).toBe("SUMMARY");
    expect(within(item).getByText(/Arquivo indisponível/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar material demonstrativo" }), {
      target: { value: "assunto inexistente" },
    });
    expect(screen.getByText("0 material(is) demonstrativo(s) encontrado(s)")).toBeInTheDocument();
    expect(screen.getByText("Nenhum material demonstrativo corresponde aos filtros.")).toBeInTheDocument();
  });
});
