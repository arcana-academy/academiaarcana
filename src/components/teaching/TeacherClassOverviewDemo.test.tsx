import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CLASS_OVERVIEW_AREAS, STUDENT_ACCESS_REQUIREMENTS, TeacherClassOverviewDemo, TeacherStudentsDemo } from "./TeacherClassOverviewDemo";

describe("Professor / Turma A / visão geral e alunos (somente leitura)", () => {
  it("exposes three illustrative overview areas without fictional metrics or operational actions", () => {
    const { container } = render(<TeacherClassOverviewDemo />);
    expect(CLASS_OVERVIEW_AREAS).toHaveLength(3);
    expect(screen.getByText("Turma demonstrativa")).toBeInTheDocument();
    expect(screen.getByText("Organização pedagógica")).toBeInTheDocument();
    expect(screen.getByText("Proteção da turma")).toBeInTheDocument();
    expect(screen.getByText(/não contém indicadores acadêmicos reais/)).toBeInTheDocument();
    expect(container.querySelectorAll("a[href], input, select, form, button")).toHaveLength(0);
  });

  it("keeps student identifiers, counters and enrollment controls unavailable", () => {
    const { container } = render(<TeacherStudentsDemo />);
    expect(STUDENT_ACCESS_REQUIREMENTS).toHaveLength(3);
    expect(screen.getByRole("status")).toHaveTextContent("Dados de estudantes não carregados");
    expect(screen.getByText("Relação de estudantes")).toBeInTheDocument();
    expect(screen.getByText("Acompanhamento individual")).toBeInTheDocument();
    expect(screen.getByText("Gestão de vínculos")).toBeInTheDocument();
    expect(screen.getByText(/Nenhuma permissão é inferida/)).toBeInTheDocument();
    expect(container.querySelectorAll("a[href], input, select, form, button, table")).toHaveLength(0);
  });
});
