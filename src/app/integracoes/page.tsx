import Link from "next/link";

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

export default async function IntegracoesPage() {
  const snapshot = await getIntegrationStatusSnapshot();

  return (
    <main
      aria-labelledby="integrations-title"
      style={{
        maxWidth: "72rem",
        margin: "0 auto",
        padding: "clamp(1.5rem, 4vw, 3rem)",
      }}
    >
      <header
        className="aa-card aa-card-elevated"
        style={{ display: "grid", gap: "var(--aa-spacing-sm)" }}
      >
        <p
          style={{
            margin: 0,
            color: "var(--aa-text-secondary)",
            fontWeight: 650,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Integrações
        </p>
        <h1 id="integrations-title" style={{ margin: 0 }}>
          Hub de integrações da Academia Arcana
        </h1>
        <p style={{ margin: 0, color: "var(--aa-text-secondary)" }}>
          Este painel separa claramente o que foi catalogado do que tem uma
          conexão externa realmente verificada.
        </p>
      </header>

      <section
        aria-labelledby="integrations-summary-title"
        style={{
          display: "grid",
          gap: "var(--aa-spacing-md)",
          gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
          marginTop: "var(--aa-spacing-lg)",
        }}
      >
        <div className="aa-card aa-card-default">
          <h2 id="integrations-summary-title">Catálogo</h2>
          <p>{snapshot.catalogSize} plugins registrados</p>
        </div>
        <div className="aa-card aa-card-default">
          <h2>Conexões verificadas</h2>
          <p>{snapshot.connectedCount}</p>
        </div>
        <div className="aa-card aa-card-default">
          <h2>Ainda catalogados</h2>
          <p>{snapshot.cataloguedCount}</p>
        </div>
        <div className="aa-card aa-card-default">
          <h2>Erros</h2>
          <p>{snapshot.errorCount}</p>
        </div>
      </section>

      <section
        aria-labelledby="integrations-list-title"
        style={{
          display: "grid",
          gap: "var(--aa-spacing-sm)",
          marginTop: "var(--aa-spacing-lg)",
        }}
      >
        <div>
          <h2 id="integrations-list-title">Plugins</h2>
          <p style={{ color: "var(--aa-text-secondary)" }}>
            Última verificação: {snapshot.generatedAt}
          </p>
        </div>

        <ul
          style={{
            display: "grid",
            gap: "var(--aa-spacing-sm)",
            gridTemplateColumns: "repeat(auto-fit, minmax(18rem, 1fr))",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {snapshot.entries.map((entry) => (
            <li key={entry.name} className="aa-card aa-card-default">
              <div
                style={{
                  alignItems: "baseline",
                  display: "flex",
                  gap: "var(--aa-spacing-sm)",
                  justifyContent: "space-between",
                }}
              >
                <h3 style={{ margin: 0 }}>{entry.name}</h3>
                <span aria-label={statusDescription(entry.status)}>
                  {statusLabel(entry.status)}
                </span>
              </div>
              <p
                style={{
                  color: "var(--aa-text-secondary)",
                  marginBottom: 0,
                }}
              >
                {statusDescription(entry.status)}
              </p>
              {entry.name === "1 Billion Brain Cells" && (
                <a
                  className="aa-button aa-button-secondary"
                  href="https://chatgpt.com/plugins/plugin_asdk_app_69cd086370708191905606fa0641d238"
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir no ChatGPT
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>

      <nav
        aria-label="Navegação de integrações"
        style={{ marginTop: "var(--aa-spacing-lg)" }}
      >
        <Link className="aa-button aa-button-secondary" href="/">
          Voltar ao início
        </Link>
      </nav>
    </main>
  );
}
