import Link from "next/link";
import { CheckCircle2, CircleAlert, Library, PlugZap } from "lucide-react";

import { getIntegrationStatusSnapshot } from "@/infrastructure/integrations/status";

function statusLabel(status: "catalogued" | "connected" | "error") {
  switch (status) {
    case "connected":
      return "Verificado";
    case "error":
      return "Erro na verificação";
    default:
      return "Catalogado";
  }
}

function statusDescription(status: "catalogued" | "connected" | "error") {
  switch (status) {
    case "connected":
      return "A conexão externa foi verificada em runtime.";
    case "error":
      return "A conexão externa falhou na última verificação.";
    default:
      return "O nome está no catálogo, mas nenhuma conexão externa foi verificada.";
  }
}

function StatusIcon({ status }: { status: "catalogued" | "connected" | "error" }) {
  if (status === "connected") {
    return <CheckCircle2 size={17} aria-hidden="true" />;
  }

  if (status === "error") {
    return <CircleAlert size={17} aria-hidden="true" />;
  }

  return <PlugZap size={17} aria-hidden="true" />;
}

export default async function IntegracoesPage() {
  const snapshot = await getIntegrationStatusSnapshot();

  return (
    <main className="aa-public-page aa-integrations-page" aria-labelledby="integrations-title">
      <div className="aa-public-frame">
        <header className="aa-card aa-card-elevated aa-page-header">
          <p className="aa-eyebrow">Integrações</p>
          <h1 id="integrations-title">Hub de integrações da Academia Arcana</h1>
          <p>
            Este painel separa claramente o que foi catalogado do que tem uma
            conexão externa realmente verificada.
          </p>
        </header>

        <section className="aa-stat-grid" aria-labelledby="integrations-summary-title">
          <article className="aa-card aa-card-default aa-stat-card">
            <Library size={18} aria-hidden="true" />
            <h2 id="integrations-summary-title">Catálogo</h2>
            <strong>{snapshot.catalogSize}</strong>
            <p>plugins registrados</p>
          </article>
          <article className="aa-card aa-card-default aa-stat-card">
            <CheckCircle2 size={18} aria-hidden="true" />
            <h2>Conexões verificadas</h2>
            <strong>{snapshot.connectedCount}</strong>
            <p>conexões confirmadas</p>
          </article>
          <article className="aa-card aa-card-default aa-stat-card">
            <PlugZap size={18} aria-hidden="true" />
            <h2>Ainda catalogados</h2>
            <strong>{snapshot.cataloguedCount}</strong>
            <p>sem verificação runtime</p>
          </article>
          <article className="aa-card aa-card-default aa-stat-card">
            <CircleAlert size={18} aria-hidden="true" />
            <h2>Erros</h2>
            <strong>{snapshot.errorCount}</strong>
            <p>última verificação</p>
          </article>
        </section>

        <section aria-labelledby="integrations-list-title">
          <div className="aa-section-heading">
            <div>
              <p className="aa-eyebrow">Status</p>
              <h2 id="integrations-list-title">Plugins</h2>
            </div>
            <p>
              Última verificação: <time dateTime={snapshot.generatedAt}>{snapshot.generatedAt}</time>
            </p>
          </div>

          <ul className="aa-card-grid aa-list-reset">
            {snapshot.entries.map((entry) => (
              <li key={entry.name} className="aa-card aa-card-default aa-integration-card">
                <div className="aa-integration-status">
                  <span className="aa-status-icon" aria-hidden="true">
                    <StatusIcon status={entry.status} />
                  </span>
                  <span
                    className={
                      entry.status === "connected"
                        ? "aa-status-success"
                        : entry.status === "error"
                          ? "aa-status-danger"
                          : "aa-status-info"
                    }
                  >
                    {statusLabel(entry.status)}
                  </span>
                </div>
                <h3>{entry.name}</h3>
                <p>{statusDescription(entry.status)}</p>
                {entry.chatgptAppUrl ? (
                  <a
                    className="aa-button aa-button-secondary"
                    href={entry.chatgptAppUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Abrir no ChatGPT
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <nav aria-label="Navegação de integrações">
          <Link className="aa-button aa-button-secondary" href="/">
            Voltar ao início
          </Link>
        </nav>
      </div>
    </main>
  );
}
