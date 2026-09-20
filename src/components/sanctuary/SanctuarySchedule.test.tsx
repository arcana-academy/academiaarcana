import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SanctuaryViewModel, ScheduleItem } from "@/domains/sanctuary";

import { SanctuarySchedule } from "./SanctuarySchedule";

type Schedule = SanctuaryViewModel["schedule"];

const realSchedule: ScheduleItem[] = [
    {
        id: "schedule-1",
        time: "08:00",
        title: "Ritual de estudo",
        location: "Biblioteca",
    },
    {
        id: "schedule-2",
        time: "14:30",
        title: "Revisão de capítulo",
    },
];

function renderSchedule(value: Schedule) {
    render(<SanctuarySchedule schedule={value} />);
}

describe("SanctuarySchedule", () => {
    it("renders the labelled section with only the real schedule items when ready", () => {
        renderSchedule({ status: "ready", data: realSchedule });

        const section = screen.getByRole("region", { name: "Agenda" });
        const heading = screen.getByRole("heading", {
            level: 2,
            name: "Agenda",
        });

        expect(section).toBeInTheDocument();
        expect(section).toHaveAttribute("aria-labelledby", "sanctuary-schedule");
        expect(heading).toHaveAttribute("id", "sanctuary-schedule");
        expect(section).toContainElement(heading);

        const list = screen.getByRole("list");
        const items = screen.getAllByRole("listitem");
        expect(list).toBeInTheDocument();
        expect(items).toHaveLength(2);

        expect(screen.getByText("08:00")).toBeInTheDocument();
        expect(screen.getByText("Ritual de estudo")).toBeInTheDocument();
        expect(screen.getByText("Biblioteca")).toBeInTheDocument();
        expect(screen.getByText("14:30")).toBeInTheDocument();
        expect(screen.getByText("Revisão de capítulo")).toBeInTheDocument();

        expect(screen.queryByText(/local n.o informado/i)).not.toBeInTheDocument();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("renders an explicit empty message without a schedule list", () => {
        renderSchedule({ status: "empty", data: null });

        expect(
            screen.getByRole("region", { name: "Agenda" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { level: 2, name: "Agenda" }),
        ).toBeInTheDocument();

        expect(screen.getByText(/ainda n.o h. itens/i)).toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
        expect(
            screen.queryByText(/n.o configurado|n.o est. configurado/i),
        ).not.toBeInTheDocument();
    });

    it("renders not-configured without a list or fabricated events", () => {
        renderSchedule({ status: "not-configured", data: null });

        expect(
            screen.getByRole("region", { name: "Agenda" }),
        ).toBeInTheDocument();

        expect(
            screen.getByText(/agenda ainda n.o est. configurado/i),
        ).toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
        expect(screen.queryByText(/ritual de estudo/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/08:00/)).not.toBeInTheDocument();
    });

    it("renders a friendly error without technical details or a schedule list", () => {
        const technicalMessage =
            "Planning query failed at digest: xyz stack trace";

        renderSchedule({
            status: "error",
            data: null,
            message: technicalMessage,
        });

        expect(
            screen.getByRole("region", { name: "Agenda" }),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/n.o foi poss.vel/i),
        ).toBeInTheDocument();

        expect(screen.queryByText(/Planning query failed/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/digest/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("does not fabricate schedule items in any non-ready state", () => {
        const nonReadyStates: Schedule[] = [
            { status: "empty", data: null },
            { status: "not-configured", data: null },
            { status: "error", data: null, message: "falha interna" },
        ];

        for (const state of nonReadyStates) {
            const { unmount } = render(<SanctuarySchedule schedule={state} />);

            expect(screen.queryByRole("list")).not.toBeInTheDocument();
            expect(
                screen.queryByText("Ritual de estudo"),
            ).not.toBeInTheDocument();
            expect(
                screen.queryByText("Revisão de capítulo"),
            ).not.toBeInTheDocument();
            expect(screen.queryByText(/08:00/)).not.toBeInTheDocument();
            expect(screen.queryByText(/14:30/)).not.toBeInTheDocument();
            expect(screen.queryByText(/biblioteca/i)).not.toBeInTheDocument();

            unmount();
        }
    });
});
