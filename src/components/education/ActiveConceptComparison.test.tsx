import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ActiveConceptComparison } from "./ActiveConceptComparison";
import type { ConceptComparisonExcerpt } from "@/application/education/concept-comparison";

const sources: [ConceptComparisonExcerpt, ConceptComparisonExcerpt] = [
  { id: "a&b", title: "Biologia", blocks: ["Células <script>alert(1)</script>"], truncated: false },
  { id: "two", title: "Química", blocks: ["Átomos e moléculas"], truncated: true },
];

describe("ActiveConceptComparison", () => {
  it("renders only escaped text and safe owned-page links, without saving data", () => {
    const html = renderToStaticMarkup(<ActiveConceptComparison pages={sources} />);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("href=\"/workspace?page=a%26b\"");
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain("<form");
    expect(html).toContain("Exibindo apenas os primeiros trechos");
  });

  it("supports accessible temporary elaboration and reset", () => {
    render(<ActiveConceptComparison pages={sources} />);
    const similarities = screen.getByRole("textbox", { name: /O que os dois conteúdos têm em comum/i });
    const differences = screen.getByRole("textbox", { name: /Em que os conceitos diferem/i });
    const example = screen.getByRole("textbox", { name: /Como você aplicaria os dois/i });
    fireEvent.change(similarities, { target: { value: "Ambos descrevem sistemas." } });
    fireEvent.change(differences, { target: { value: "Escalas distintas." } });
    fireEvent.change(example, { target: { value: "Uma célula usa moléculas." } });
    expect(similarities).toHaveValue("Ambos descrevem sistemas.");
    expect(differences).toHaveValue("Escalas distintas.");
    expect(example).toHaveValue("Uma célula usa moléculas.");
    fireEvent.click(screen.getByRole("button", { name: "Limpar anotações sem salvar" }));
    expect(similarities).toHaveValue("");
    expect(differences).toHaveValue("");
    expect(example).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent(/não são enviadas nem salvas/);
  });

  it("honestly represents saved pages without text blocks", () => {
    render(<ActiveConceptComparison pages={[
      { ...sources[0], blocks: [] }, sources[1],
    ]} />);
    expect(screen.getByText(/ainda não tem blocos textuais preenchidos/)).toBeInTheDocument();
  });
});
