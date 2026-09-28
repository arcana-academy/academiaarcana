"use client";

import { unstable_rethrow } from "next/navigation";

import { Button } from "@/components/ui";

/**
 * Props Next.js passes to a route-segment error boundary.
 */
type SanctuaryErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Recovery UI for a fatal failure while rendering the Sanctuary route. */
export default function SanctuaryError({
  error,
  reset,
}: SanctuaryErrorProps) {
  unstable_rethrow(error);

  return (
    <main
      className="aa-error-page"
      aria-labelledby="sanctuary-error-title"
    >
      <section className="aa-error-card aa-card aa-card-elevated">
        <p className="aa-eyebrow">Santuário</p>
        <h1 id="sanctuary-error-title">
          Não foi possível carregar o Santuário
        </h1>
        <div className="aa-alert aa-alert-danger" role="alert">
          <p>
            Ocorreu um erro inesperado ao preparar seu Santuário de
            aprendizagem. Tente novamente para continuar.
          </p>
        </div>
        <Button variant="primary" onClick={() => reset()}>
          Tentar novamente
        </Button>
      </section>
    </main>
  );
}
