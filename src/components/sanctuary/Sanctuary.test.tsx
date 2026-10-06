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
        label: "Explorar conteúdo",
        href: "/workspace?view=tree#current",
        priority: "primary",
    },
    continueLearning: {
        status: "ready",
        data: {
            intent: "explore",
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
    },
    progress: {
        status: "not-configured",
        data: null,
    },
    missions: {
        status: "not-configured",
        data: null,
    },
    schedule: {
        status: "not-configured",
        data: null,
    },
    adaptiveRecommendation: {
        title: "Explore no seu ritmo",
        message: "Escolha um conteúdo e avance no seu ritmo.",
        reason: "Não há sinais suficientes para uma recomendação mais específica.",
        href: "/grimorios",
    },
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
                name: "Explorar conteúdo",
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

    it("exposes the Mestre Arcano command center", () => {
    render(<Sanctuary viewModel={viewModel} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Seu próximo passo pode começar aqui.",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("textbox", {
        name: "Mensagem para o Mestre Arcano",
      }),
    ).toBeTruthy();
  });

  it("delegates the missions section to SanctuaryMissions", () => {
        render(<Sanctuary viewModel={viewModel} />);

        expect(
            screen.getByRole("heading", { level: 2, name: "Missões" }),
        ).toBeTruthy();
        expect(
            screen.getByText(/recurso de miss.es ainda n.o est. configurado/i),
        ).toBeTruthy();
        expect(screen.queryByRole("list")).toBeNull();
    });

    it("delegates the schedule section to SanctuarySchedule", () => {
        render(<Sanctuary viewModel={viewModel} />);

        expect(
            screen.getByRole("heading", { level: 2, name: "Agenda" }),
        ).toBeTruthy();
        expect(
            screen.getByText(/recurso de agenda ainda n.o est. configurado/i),
        ).toBeTruthy();
        expect(screen.queryByRole("list")).toBeNull();
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
                    continueLearning: {
                        status: "empty",
                        data: null,
                    },
                }}
            />,
        );

        expect(
            screen.getByText(
                "Nenhum conteúdo disponível para abrir no Santuário ainda. Explore seus Grimórios quando estiver pronto.",
            ),
        ).toBeTruthy();
    });

    it("renders learning-source error distinctly from empty", () => {
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
                    continueLearning: {
                        status: "error",
                        data: null,
                        message: "internal database failure",
                    },
                }}
            />,
        );

        expect(
            screen.getByRole("heading", {
                level: 2,
                name: "Contexto de aprendizagem",
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Não foi possível carregar seu contexto de aprendizagem agora."),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(/Nenhum conteúdo disponível/i),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText(/internal database failure/i),
        ).not.toBeInTheDocument();
    });
});