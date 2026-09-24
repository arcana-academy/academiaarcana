import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SanctuaryMission, SanctuaryViewModel } from "@/domains/sanctuary";

import { SanctuaryMissions } from "./SanctuaryMissions";

type Missions = SanctuaryViewModel["missions"];

const realMissions: SanctuaryMission[] = [
    {
        id: "mission-1",
        title: "Primeira meditação",
        reward: "50 XP",
        isCompleted: true,
    },
    {
        id: "mission-2",
        title: "Diário de aprendizagem",
        reward: "30 XP",
        isCompleted: false,
    },
];

function renderMissions(value: Missions) {
    render(<SanctuaryMissions missions={value} />);
}

describe("SanctuaryMissions", () => {
    it("renders the labelled section with only the real missions when ready", () => {
        renderMissions({ status: "ready", data: realMissions });

        const section = screen.getByRole("region", { name: "Missões" });
        const heading = screen.getByRole("heading", {
            level: 2,
            name: "Missões",
        });

        expect(section).toBeInTheDocument();
        expect(section).toHaveAttribute("aria-labelledby", "sanctuary-missions");
        expect(heading).toHaveAttribute("id", "sanctuary-missions");
        expect(section).toContainElement(heading);

        const list = screen.getByRole("list");
        const items = screen.getAllByRole("listitem");
        expect(list).toBeInTheDocument();
        expect(items).toHaveLength(2);

        expect(screen.getByText("Primeira meditação")).toBeInTheDocument();
        expect(screen.getByText("50 XP")).toBeInTheDocument();
        expect(screen.getByText("Diário de aprendizagem")).toBeInTheDocument();
        expect(screen.getByText("30 XP")).toBeInTheDocument();

        expect(screen.getByText("Concluída")).toBeInTheDocument();
        expect(screen.getByText("Em aberto")).toBeInTheDocument();

        expect(screen.queryByRole("button")).not.toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("renders an explicit empty message without a mission list", () => {
        renderMissions({ status: "empty", data: null });

        expect(
            screen.getByRole("region", { name: "Missões" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { level: 2, name: "Missões" }),
        ).toBeInTheDocument();

        expect(screen.getByText(/ainda n.o h. miss/i)).toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
        expect(
            screen.queryByText(/n.o configurado|n.o est. configurado/i),
        ).not.toBeInTheDocument();
    });

    it("renders not-configured without a list or fabricated missions", () => {
        renderMissions({ status: "not-configured", data: null });

        expect(
            screen.getByRole("region", { name: "Missões" }),
        ).toBeInTheDocument();

        expect(
            screen.getByText(/ainda n.o est. configurado|n.o configurado/i),
        ).toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
        expect(screen.queryByText(/xp/i)).not.toBeInTheDocument();
    });

    it("renders a friendly error without technical details or a mission list", () => {
        const technicalMessage =
            "Queue fetch failed at digest: xyz stack trace";

        renderMissions({
            status: "error",
            data: null,
            message: technicalMessage,
        });

        expect(
            screen.getByRole("region", { name: "Missões" }),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/n.o foi poss.vel/i),
        ).toBeInTheDocument();

        expect(screen.queryByText(/Queue fetch failed/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/digest/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("does not fabricate missions in any non-ready state", () => {
        const nonReadyStates: Missions[] = [
            { status: "empty", data: null },
            { status: "not-configured", data: null },
            { status: "error", data: null, message: "falha interna" },
        ];

        for (const state of nonReadyStates) {
            const { unmount } = render(<SanctuaryMissions missions={state} />);

            expect(screen.queryByRole("list")).not.toBeInTheDocument();
            expect(
                screen.queryByText("Primeira meditação"),
            ).not.toBeInTheDocument();
            expect(
                screen.queryByText("Diário de aprendizagem"),
            ).not.toBeInTheDocument();
            expect(screen.queryByText(/xp/i)).not.toBeInTheDocument();

            unmount();
        }
    });
});
