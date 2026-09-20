import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SanctuaryViewModel } from "@/domains/sanctuary";

import { Sanctuary } from "./Sanctuary";

const viewModel: SanctuaryViewModel = {
    header: {
        greeting: "Seu Santuário de aprendizagem",
        user: {
            id: "user-1",
            displayName: "Taynara",
        },
    },
    primaryAction: {
        id: "continue-learning",
        label: "Continuar aprendendo",
        href: "/workspace?view=tree#current",
        priority: "primary",
    },
    continueLearning: {
        grimoireId: "grimoire-1",
        grimoireTitle: "Anatomia",
        notebookId: "notebook-1",
        notebookTitle: "Sistema musculoesquelético",
        chapterId: "chapter-1",
        chapterTitle: "Introdução",
        pageId: "page-1",
        pageTitle: "Página inicial",
        href: "/workspace?view=tree#current",
    },
    progress: null,
    missions: [],
    schedule: [],
    quickActions: [
        {
            id: "open-workspace",
            label: "Abrir Workspace",
            href: "/workspace?view=tree#current",
            priority: "supporting",
        },
    ],
};

describe("Sanctuary", () => {
    it("renders the sanctuary shell from a view model", () => {
        render(<Sanctuary viewModel={viewModel} />);

        expect(
            screen.getByRole("heading", {
                name: "Seu Santuário de aprendizagem",
            }),
        ).toBeTruthy();

        expect(
            screen.getByRole("link", {
                name: "Continuar aprendendo",
            }),
        ).toBeTruthy();
    });

    it("delegates the identity header to SanctuaryHeader", () => {
        render(<Sanctuary viewModel={viewModel} />);

        const heading = screen.getByRole("heading", {
            level: 1,
            name: "Seu Santuário de aprendizagem",
        });

        expect(heading).toHaveAttribute("id", "sanctuary-title");
        expect(screen.getByTestId("sanctuary-user-name")).toHaveTextContent(
            "Taynara",
        );
    });

    it("does not require Supabase or repository access", () => {
        render(<Sanctuary viewModel={viewModel} />);

        expect(screen.getByRole("main")).toBeTruthy();
    });

    it("renders an explicit empty state when there is no learning continuation", () => {
        render(
            <Sanctuary
                viewModel={{
                    ...viewModel,
                    primaryAction: {
                        id: "open-workspace",
                        label: "Abrir Workspace",
                        href: "/workspace?view=tree#current",
                        priority: "supporting",
                    },
                    continueLearning: null,
                }}
            />,
        );

        expect(screen.getByText(/começar|explorar/i)).toBeTruthy();
    });
});