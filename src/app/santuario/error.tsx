"use client";

import { unstable_rethrow } from "next/navigation";

import { Button } from "@/components/ui";

/**
 * Props Next.js passes to a route-segment `error.tsx` boundary.
 *
 * `error` is part of the contract but is deliberately never read, so
 * `error.message`, `error.digest` and stack traces can never leak into the
 * user-facing fallback.
 */
type SanctuaryErrorProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

/**
 * Recovery UI for a fatal failure while rendering the Sanctuary route.
 *
 * Follows the project convention for `error.tsx`: a Client Component that
 * receives `error`/`reset` and retries through `reset()`. It introduces no new
 * observability integration, and communicates the failure in text so it does
 * not rely on color alone.
 */
export default function SanctuaryError({ error, reset }: SanctuaryErrorProps) {
    unstable_rethrow(error);

    return (
        <main aria-labelledby="sanctuary-error-title">
            <h1 id="sanctuary-error-title">
                Não foi possível carregar o Santuário
            </h1>

            <div role="alert">
                <p>
                    Ocorreu um erro inesperado ao preparar seu Santuário de
                    aprendizagem. Tente novamente para continuar.
                </p>
            </div>

            <Button variant="primary" onClick={() => reset()}>
                Tentar novamente
            </Button>
        </main>
    );
}
