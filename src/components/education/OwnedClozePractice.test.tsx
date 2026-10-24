import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ConceptComparisonExcerpt } from "@/application/education/concept-comparison";
import { OwnedClozePractice } from "./OwnedClozePractice";

const page: ConceptComparisonExcerpt = {
  id: "page&1", title: "Biologia",
  blocks: [
    "Fotossíntese converte energia luminosa.",
    "Células possuem estruturas diversas.",
  ],
  truncated: true,
};

describe("OwnedClozePractice", () => {
  it("hides real words until individually revealed, and resets on another passage", () => {
    render(<OwnedClozePractice page={page} />);
    expect(screen.getByRole("status")).toHaveTextContent("Trecho 1 de 2");
    expect(screen.queryByText("Fotossíntese")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Revelar lacuna 1" }));
    expect(screen.getByRole("button", { name: "Ocultar lacuna 1" })).toHaveTextContent("Fotossíntese");
    fireEvent.click(screen.getByRole("button", { name: "Ocultar lacuna 1" }));
    expect(screen.getByRole("button", { name: "Revelar lacuna 1" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "Revelar lacuna 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Próximo trecho" }));
    expect(screen.getByRole("status")).toHaveTextContent("Trecho 2 de 2");
    expect(screen.getByRole("button", { name: "Revelar lacuna 1" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "Trecho anterior" }));
    expect(screen.getByRole("button", { name: "Revelar lacuna 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir página inteira/ })).toHaveAttribute(
      "href", "/workspace?page=page%261",
    );
  });

  it("keeps saved HTML-like text inert and never submits user content", () => {
    const html = renderToStaticMarkup(<OwnedClozePractice page={{
      ...page, blocks: ['<img src=x onerror=alert(1)> partículas moléculas'],
    }} />);
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;");
    expect(html).not.toContain("<form");
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("represents short passages and no saved text truthfully", () => {
    const { rerender } = render(<OwnedClozePractice page={{ ...page, blocks: ["Sol e mar."] }} />);
    expect(screen.getByText(/não contém palavras longas suficientes/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Revelar lacuna/ })).not.toBeInTheDocument();
    rerender(<OwnedClozePractice key="empty" page={{ ...page, blocks: [] }} />);
    expect(screen.getByRole("status")).toHaveTextContent(/ainda não tem texto/);
  });
});
