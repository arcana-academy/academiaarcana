import Link from "next/link";
import OpenSourceAiPlayground from "./open-source-ai-playground";
import { getOpenSourceAiStatus, openSourceAiIntegrations } from "@/infrastructure/integrations/open-source-ai";

export const dynamic = "force-dynamic";

export default function OpenSourceAiPage() {
  const configuredProviders = openSourceAiIntegrations.map((integration) => ({ id: integration.id, name: integration.name, runtime: integration.runtime, configured: getOpenSourceAiStatus(integration).configured }));

  return (
    <main aria-labelledby="open-ai-title" style={{ maxWidth: "78rem", margin: "0 auto", padding: "clamp(1.5rem, 4vw, 3rem)" }}>
      <header className="aa-card aa-card-elevated" style={{ display: "grid", gap: "var(--aa-spacing-sm)" }}>
        <p style={{ margin: 0, color: "var(--aa-text-secondary)", fontWeight: 650, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Ecossistema de IA aberta
        </p>
        <h1 id="open-ai-title" style={{ margin: 0 }}>Laboratório de IA aberta da Academia Arcana</h1>
        <p style={{ margin: 0, color: "var(--aa-text-secondary)" }}>
          Gateway único para modelos, agentes, RAG, inference e bancos vetoriais. Cada integração permanece opcional e desacoplada.
        </p>
      </header>

      <section aria-labelledby="open-ai-grid-title" style={{ display: "grid", gap: "var(--aa-spacing-md)", gridTemplateColumns: "repeat(auto-fit, minmax(19rem, 1fr))", marginTop: "var(--aa-spacing-lg)" }}>
        <h2 id="open-ai-grid-title" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Integrações disponíveis</h2>
        {openSourceAiIntegrations.map((integration) => {
          const status = getOpenSourceAiStatus(integration);
          return (
            <article key={integration.id} className="aa-card aa-card-default" style={{ display: "grid", gap: "var(--aa-spacing-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--aa-spacing-sm)" }}>
                <div>
                  <h2 style={{ margin: 0 }}>{integration.name}</h2>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--aa-text-secondary)" }}>{integration.product}</p>
                </div>
                <span aria-label={status.configured ? "Configurado" : "Opcional"}>{status.configured ? "● Configurado" : "○ Opcional"}</span>
              </div>
              <p style={{ margin: 0 }}>{integration.description}</p>
              <div style={{ color: "var(--aa-text-secondary)", fontSize: "var(--aa-type-scale-sm)" }}>
                <strong>Licença:</strong> {integration.license}<br />
                <strong>Runtime:</strong> {integration.runtime}<br />
                <strong>Capacidades:</strong> {integration.capabilities.join(", ")}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--aa-spacing-sm)" }}>
                <a className="aa-button aa-button-secondary" href={integration.websiteUrl} target="_blank" rel="noreferrer">Site</a>
                <a className="aa-button aa-button-secondary" href={integration.repositoryUrl} target="_blank" rel="noreferrer">Repositório</a>
              </div>
            </article>
          );
        })}
      </section>

      <OpenSourceAiPlayground providers={configuredProviders} />

      <section className="aa-card aa-card-default" style={{ marginTop: "var(--aa-spacing-lg)" }}>
        <h2>Runtime local</h2>
        <p style={{ color: "var(--aa-text-secondary)" }}>
          Ollama, vLLM e BentoML podem ser ativados por endpoint no ambiente do servidor. Chaves nunca são expostas ao navegador.
        </p>
        <Link className="aa-button aa-button-secondary" href="/integracoes">Voltar para integrações</Link>
      </section>
    </main>
  );
}
