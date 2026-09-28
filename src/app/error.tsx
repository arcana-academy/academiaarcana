"use client";

import { useEffect } from "react";
import { Honeybadger } from "@honeybadger-io/react";

import { Button } from "@/components/ui";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Displays the fallback for an uncaught route-segment error.
 *
 * The captured error is reported to Honeybadger, but implementation details are
 * never rendered to the user.
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    Honeybadger.notify(error);
  }, [error]);

  return (
    <main className="aa-error-page" aria-labelledby="route-error-title">
      <section className="aa-error-card aa-card aa-card-elevated">
        <p className="aa-eyebrow">Academia Arcana</p>
        <h1 id="route-error-title">Something went wrong!</h1>
        <div className="aa-alert aa-alert-danger" role="alert">
          <p>
            Ocorreu um erro inesperado. Tente novamente para continuar sua
            jornada.
          </p>
        </div>
        <Button variant="primary" onClick={() => reset()}>
          Try again
        </Button>
      </section>
    </main>
  );
}
