"use client";

/** Renders a recoverable error state for the educational practice surface. */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="aa-page" aria-labelledby="practice-error-title">
      <section className="aa-card aa-card-elevated">
        <h1 id="practice-error-title">Não foi possível carregar a prática</h1>
        <p className="aa-state-copy">
          A atividade não foi concluída e nenhuma evidência parcial é tratada como
          resultado. Tente novamente.
        </p>
        <button className="aa-button aa-button-primary" type="button" onClick={reset}>
          Tentar novamente
        </button>
      </section>
    </main>
  );
}
