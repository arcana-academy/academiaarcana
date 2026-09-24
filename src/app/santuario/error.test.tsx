import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SanctuaryError from "./error";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));

describe("SanctuaryError", () => {
    it("renders a friendly error message in Brazilian Portuguese", () => {
        render(<SanctuaryError error={new Error("falha")} reset={vi.fn()} />);

        expect(
            screen.getByRole("heading", {
                name: "Não foi possível carregar o Santuário",
            }),
        ).toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent(
            /erro inesperado/i,
        );
    });

    it("does not expose the raw error message", () => {
        const error = new Error("mensagem tecnica privada");

        render(<SanctuaryError error={error} reset={vi.fn()} />);

        expect(
            screen.queryByText(/mensagem tecnica privada/i),
        ).not.toBeInTheDocument();
    });

    it("offers a recovery action wired to the Next.js reset callback", () => {
        const reset = vi.fn();

        render(<SanctuaryError error={new Error("falha")} reset={reset} />);

        fireEvent.click(
            screen.getByRole("button", { name: "Tentar novamente" }),
        );

        expect(reset).toHaveBeenCalledOnce();
    });

    it("declares the client directive required by Next.js error boundaries", () => {
        const source = readFileSync(
            join(moduleDirectory, "error.tsx"),
            "utf8",
        );

        expect(source).toMatch(/^["']use client["'];/);
    });

    it("communicates the failure without relying on color alone", () => {
        render(<SanctuaryError error={new Error("falha")} reset={vi.fn()} />);

        const alert = screen.getByRole("alert");

        expect(alert).toHaveTextContent(/\w+/);
        expect(alert.textContent?.trim().length).toBeGreaterThan(0);
        expect(screen.getByRole("main")).toHaveAttribute(
            "aria-labelledby",
            "sanctuary-error-title",
        );
    });

    it("does not expose diagnostic details in the user-facing fallback", () => {
        const error = Object.assign(new Error("detalhe privado"), {
            digest: "digest-privado",
        });

        render(<SanctuaryError error={error} reset={vi.fn()} />);

        expect(screen.queryByText(/detalhe privado/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/digest-privado/i)).not.toBeInTheDocument();
    });

    it("does not add a new observability integration", () => {
        const source = readFileSync(
            join(moduleDirectory, "error.tsx"),
            "utf8",
        );

        expect(source).not.toMatch(/honeybadger/i);
    });
});
