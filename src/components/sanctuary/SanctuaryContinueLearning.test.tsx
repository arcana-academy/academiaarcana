import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SanctuaryViewModel } from "@/domains/sanctuary";

import { SanctuaryContinueLearning } from "./SanctuaryContinueLearning";

type ContinueLearning = SanctuaryViewModel["continueLearning"];

const continueLearning: Exclude<ContinueLearning, null> = {
    grimoireId: "grimoire-1",
    grimoireTitle: "Anatomia",
    notebookId: "notebook-1",
    notebookTitle: "Sistema musculoesquelético",
    chapterId: "chapter-1",
    chapterTitle: "Introdução",
    pageId: "page-1",
    pageTitle: "Página inicial",
    href: "/workspace?view=tree#current",
};

function renderSection(value: ContinueLearning) {
    render(<SanctuaryContinueLearning continueLearning={value} />);
}

describe("SanctuaryContinueLearning", () => {
    it("renders the available hierarchy inside a labelled section", () => {
        renderSection(continueLearning);

        const section = screen.getByRole("region", {
            name: "Continuar aprendendo",
        });
        const heading = screen.getByRole("heading", {
            level: 2,
            name: "Continuar aprendendo",
        });

        expect(section).toBeInTheDocument();
        expect(heading).toHaveAttribute("id", "sanctuary-continue-learning");
        expect(section).toHaveAttribute(
            "aria-labelledby",
            "sanctuary-continue-learning",
        );
        expect(section).toContainElement(heading);
        expect(
            screen.getByText("Sistema musculoesquelético"),
        ).toBeInTheDocument();
        expect(screen.getByText("Introdução")).toBeInTheDocument();
        expect(screen.getByText("Página inicial")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Retomar este estudo" }))
            .toHaveAttribute("href", continueLearning.href);
        expect(screen.getByRole("group", { name: "Caminho atual" }))
            .toContainElement(screen.getByText("Página inicial"));
    });

    it("renders only the available hierarchy levels", () => {
        renderSection({
            ...continueLearning,
            notebookTitle: undefined,
            chapterTitle: undefined,
            pageTitle: undefined,
        });

        expect(screen.getByText("Anatomia")).toBeInTheDocument();
        expect(
            screen.queryByText("Sistema musculoesquelético"),
        ).not.toBeInTheDocument();
        expect(screen.queryByText("Introdução")).not.toBeInTheDocument();
        expect(screen.queryByText("Página inicial")).not.toBeInTheDocument();
    });

    it("renders the explicit empty state when there is no learning continuation", () => {
        renderSection(null);

        expect(
            screen.getByRole("region", { name: "Continuar aprendendo" }),
        ).toBeInTheDocument();
        expect(screen.getByText(/Nenhum estudo recente/i)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Explorar Grimórios" }))
            .toHaveAttribute("href", "/grimorios");
        expect(screen.queryByRole("link", { name: "Retomar este estudo" }))
            .not.toBeInTheDocument();
    });
});
