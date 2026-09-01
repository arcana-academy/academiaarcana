"use client";

import { logger } from "@/core/observability";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  logger.error("Unhandled global application error", { digest: error.digest });

  return (
    <html lang="pt-BR">
      <body>
        <main aria-labelledby="global-error-title">
          <h1 id="global-error-title">A Academia encontrou um problema.</h1>
          <p>Não foi possível carregar esta página.</p>
          <button type="button" onClick={reset}>
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
