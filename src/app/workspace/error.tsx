"use client";

import Link from "next/link";
import { unstable_rethrow } from "next/navigation";

type WorkspaceErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Recover from transient Workspace hierarchy read failures without leaking data. */
export default function WorkspaceError({ error, reset }: WorkspaceErrorProps) {
  // Never turn authentication redirects or Next.js internal control flow into
  // a retryable data-loading error.
  unstable_rethrow(error);

  return (
    <main className="aa-page aa-page-narrow" aria-labelledby="workspace-error-title">
      <section className="aa-surface aa-sanctuary-section">
        <h1 id="workspace-error-title">Não foi possível carregar o editor de estudos</h1>
        <p role="alert">
          Não foi possível recuperar seus grimórios, capítulos e páginas agora.
          Seus estudos não foram alterados. Tente novamente.
        </p>
        <div className="aa-card-actions">
          <button className="aa-button aa-button-primary" type="button" onClick={reset}>
            Tentar novamente
          </button>
          <Link className="aa-button aa-button-secondary" href="/grimorios">
            Voltar aos Grimórios
          </Link>
        </div>
      </section>
    </main>
  );
}
