"use client";

import { AlertTriangle } from "lucide-react";
import { unstable_rethrow } from "next/navigation";

import { Button } from "@/components/ui";

type SanctuaryErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SanctuaryError({ error, reset }: SanctuaryErrorProps) {
  unstable_rethrow(error);

  return (
    <main className="aa-error-page" aria-labelledby="sanctuary-error-title">
      <section className="aa-card aa-card-elevated aa-error-state">
        <div className="aa-card-icon" aria-hidden="true">
          <AlertTriangle size={22} strokeWidth={1.8} />
        </div>
        <p className="aa-eyebrow">Santuário</p>
        <h1 id="sanctuary-error-title">Não foi possível carregar o Santuário</h1>

        <div className="aa-state-card" data-state="error" role="alert">
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
