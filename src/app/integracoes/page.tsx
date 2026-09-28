import Link from "next/link";

import { Badge } from "@/components/ui";
import { getIntegrationStatusSnapshot } from "@/infrastructure/integrations/status";

type IntegrationStatus = "catalogued" | "connected" | "error";

function statusLabel(status: IntegrationStatus) {
  switch (status) {
    case "connected":
      return "Verificado";
    case "error":
      return "Erro na verificação";
    default:
      return "Catalogado";
  }
}

function statusVariant(
  status: IntegrationStatus,
): "neutral" | "success" | "danger" {
  switch (status) {
    case "connected":
      return "success";
    case "error":
      return "danger";
    default:
      return "neutral";
  }
}

function statusDescription(status: IntegrationStatus) {
  switch (status) {
    case "connected":
      return "A conexão externa foi verificada em runtime.";
    case "error":
      return "A conexão externa falhou na última verificação.";
    default:
      return "O nome está no catálogo, mas nenhuma conexão externa foi verificada.";
  }
}

export default async function IntegracoesPage() {
  const snapshot = await getIntegrationStatusSnapshot();

  return (
    <main
      className="aa-page aa-page-wide"
      aria-labelledby="integrations-title"
    >
      <header className="aa-card aa-card-elevated aa-page-header">
        <p className="aa-eyebrow">Integrações</p>
        <h1 id="integrations-title">Hub de integrações da Academia Arcana</h1>
        <p className="aa-page-intro">
          Este painel separa claramente o que foi catalogado do que tem uma
          conexão externa realmente verificada.
        </p>
      </header>

      <section
        className="aa-section"
        aria-labelledby="integrations-summary-title"
      >
        <header className="aa-page-header">
          <h2 id="integrations-summary-title">Visão geral</h2>
          <p className="aa-page-intro">
            Os números abaixo refletem o snapshot retornado pela camada de
            integrações, sem inventar conexões ausentes.
          </p>
        </header>

        <div className="aa-card-grid">
          <article className="aa-card aa-card-default">
            <p className="aa-eyebrow">Catálogo</p>
            <h3>{snapshot.catalogSize} plugins registrados</h3>
          </article>
          <article className="aa-card aa-card-default">
            <p className="aa-eyebrow">Verificados</p>
            <h3>{snapshot.connectedCount}</h3>
            <p>Conexões verificadas</p>
          </article>
          <article className="aa-card aa-card-default">
            <p className="aa-eyebrow">Catalogados</p>
            <h3>{snapshot.cataloguedCount}</h3>
            <p>Ainda catalogados</p>
          </article>
          <article className="aa-card aa-card-default">
            <p className="aa-eyebrow">Erros</p>
            <h3>{snapshot.errorCount}</h3>
            <p>última verificação com falha</p>
          </article>
        </div>
      </section>

      <section className="aa-section" aria-labelledby="integrations-list-title">
        <header className="aa-page-header">
          <h2 id="integrations-list-title">Plugins</h2>
          <p className="aa-page-intro">
            Última verificação: {snapshot.generatedAt}
          </p>
        </header>

        <ul className="aa-card-grid aa-card-list">
          {snapshot.entries.map((entry) => (
            <li
              key={entry.name}
              className="aa-card aa-card-default aa-feature-card"
            >
              <div className="aa-card-heading-row">
                <h3>{entry.name}</h3>
                <Badge
                  variant={statusVariant(entry.status)}
                  aria-label={statusDescription(entry.status)}
                >
                  {statusLabel(entry.status)}
                </Badge>
              </div>

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

      <nav aria-label="Navegação de integrações" className="aa-actions">
        <Link className="aa-button aa-button-secondary" href="/">
          Voltar ao início
        </Link>
      </nav>
    </main>
  );
}
