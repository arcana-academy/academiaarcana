"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Honeybadger } from "@honeybadger-io/react";

import { Button } from "@/components/ui";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    Honeybadger.notify(error);
  }, [error]);

  return (
    <main className="aa-error-page" aria-labelledby="route-error-title">
      <section className="aa-card aa-card-elevated aa-error-state">
        <div className="aa-card-icon" aria-hidden="true">
          <AlertTriangle size={22} strokeWidth={1.8} />
        </div>
        <p className="aa-eyebrow">Falha recuperável</p>
        <h1 id="route-error-title">Não foi possível carregar esta página</h1>
        <p>
          Ocorreu um erro inesperado. Tente novamente; seus dados e o endereço
          atual serão preservados sempre que possível.
        </p>
        <div className="aa-form-actions">
          <Button variant="primary" onClick={() => reset()}>
            Tentar novamente
          </Button>
          <Link className="aa-button aa-button-secondary" href="/santuario">
            Ir para o Santuário
          </Link>
        </div>
      </section>
    </main>
  );
}
