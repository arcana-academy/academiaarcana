import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { FeaturePage } from "./FeaturePage";

describe("FeaturePage", () => {
  test("renders a consistent accessible page structure", () => {
    render(
      <FeaturePage
        eyebrow="Estudos"
        title="Missões"
        description="Acompanhe suas missões de estudo."
        items={[
          { title: "Missões diárias", description: "Estrutura visual para desafios recorrentes." },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Missões" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Estrutura preparada para crescer" })).toBeTruthy();
    expect(screen.getByText("Estrutura de interface criada")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Voltar ao Santuário/ })).toHaveAttribute(
      "href",
      "/santuario",
    );
  });
});
