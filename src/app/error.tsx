"use client";

import { useEffect } from "react";
import { logger } from "@/core/observability";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error("Unhandled application error", { digest: error.digest });
  }, [error]);

  return (
    <main aria-labelledby="error-title">
      <h1 id="error-title">Algo deu errado.</h1>
      <p>Não foi possível concluir esta ação.</p>
      <button type="button" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
