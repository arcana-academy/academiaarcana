"use client";

import { useEffect } from "react";
import { Honeybadger } from "@honeybadger-io/react";

import "./globals.css";
import { Button } from "@/components/ui";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Displays the document-level fallback for a root layout error.
 *
 * The captured error is reported to Honeybadger, but implementation details are
 * never rendered to the user.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Honeybadger.notify(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main className="aa-error-page" aria-labelledby="global-error-title">
          <section className="aa-error-card aa-card aa-card-elevated">
            <p className="aa-eyebrow">Academia Arcana</p>
            <h1 id="global-error-title">A Academia Arcana encontrou um erro</h1>
            <div className="aa-alert aa-alert-danger" role="alert">
              <p>
                Não foi possível concluir o carregamento. Tente novamente para
                voltar à experiência.
              </p>
            </div>
            <Button variant="primary" onClick={() => reset()}>
              Tentar novamente
            </Button>
          </section>
        </main>
      </body>
    </html>
  );
}
