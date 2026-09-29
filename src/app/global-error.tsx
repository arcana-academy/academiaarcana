"use client";

import { useEffect } from "react";
import { Honeybadger } from "@honeybadger-io/react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Honeybadger.notify(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "#17151C",
          color: "#E6DFEC",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main
          aria-labelledby="global-error-title"
          style={{
            width: "min(100%, 32rem)",
            padding: "2rem",
            border: "1px solid #51475A",
            borderRadius: "14px",
            background: "#2A2432",
          }}
        >
          <p style={{ marginTop: 0, color: "#B9A4CF", fontWeight: 750 }}>
            Academia Arcana
          </p>
          <h1 id="global-error-title" style={{ marginTop: 0 }}>
            A aplicação encontrou um erro inesperado
          </h1>
          <p>
            Tente recarregar esta página. O sistema de observabilidade já
            recebeu o erro para investigação.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              minHeight: "44px",
              padding: "0.75rem 1rem",
              border: "1px solid #75687F",
              borderRadius: "10px",
              background: "#B9A4CF",
              color: "#211D28",
              font: "inherit",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
