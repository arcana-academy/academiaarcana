import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SanctuaryViewModel } from "@/domains/sanctuary";

import { SanctuaryProgress } from "./SanctuaryProgress";

type Progress = SanctuaryViewModel["progress"];

function renderProgress(value: Progress) {
    render(<SanctuaryProgress progress={value} />);
}

describe("SanctuaryProgress", () => {
    it("renders title, label and progressbar with the real value when ready", () => {
        renderProgress({
            status: "ready",
            data: { percentage: 42, label: "42% concluído" },
        });

        const section = screen.getByRole("region", { name: "Progresso" });
        const heading = screen.getByRole("heading", {
            level: 2,
            name: "Progresso",
        });

        expect(section).toBeInTheDocument();
        expect(section).toHaveAttribute("aria-labelledby", "sanctuary-progress");
        expect(heading).toHaveAttribute("id", "sanctuary-progress");
        expect(section).toContainElement(heading);

        expect(screen.getByText("42% concluído")).toBeInTheDocument();

        const progressbar = screen.getByRole("progressbar");
        expect(progressbar).toBeInTheDocument();
        expect(progressbar).toHaveAttribute("aria-valuenow", "42");
    });

    it("represents empty as absence of data without progressbar or 0%", () => {
        renderProgress({ status: "empty", data: null });

        expect(
            screen.getByRole("region", { name: "Progresso" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { level: 2, name: "Progresso" }),
        ).toBeInTheDocument();

        expect(screen.getByText(/ainda n.o h. dados/i)).toBeInTheDocument();
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
        expect(screen.queryByText(/0%/)).not.toBeInTheDocument();
        expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });

    it("renders not-configured without progressbar, percentage or fabricated data", () => {
        renderProgress({ status: "not-configured", data: null });

        expect(
            screen.getByRole("region", { name: "Progresso" }),
        ).toBeInTheDocument();

        expect(
            screen.getByText(/ainda n.o est. configurado|n.o configurado/i),
        ).toBeInTheDocument();
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
        expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });

    it("renders a friendly error without technical details or progressbar", () => {
        const technicalMessage =
            "DB connection failed at 0xFAIL stack trace digest: abc123";

        renderProgress({
            status: "error",
            data: null,
            message: technicalMessage,
        });

        expect(
            screen.getByRole("region", { name: "Progresso" }),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/n.o foi poss.vel/i),
        ).toBeInTheDocument();

        expect(screen.queryByText(/DB connection failed/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/abc123/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/digest/i)).not.toBeInTheDocument();
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("does not fabricate progress data in any state", () => {
        const nonReadyStates: Progress[] = [
            { status: "empty", data: null },
            { status: "not-configured", data: null },
            { status: "error", data: null, message: "falha interna" },
        ];

        for (const state of nonReadyStates) {
            const { unmount } = render(<SanctuaryProgress progress={state} />);

            expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
            expect(screen.queryByText(/%/)).not.toBeInTheDocument();

            unmount();
        }
    });
});
