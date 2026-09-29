import Link from "next/link";

import { getIntegrationStatusSnapshot } from "@/infrastructure/integrations/status";
import {
  ARCANA_TOOL_TRACKS,
} from "@/infrastructure/integrations/arcana-tool-map";
import {
  NVIDIA_PHYSICAL_AI_SKILLS,
  NVIDIA_PHYSICAL_AI_TRACKS,
} from "@/infrastructure/integrations/nvidia-physical-ai";

export const dynamic = "force-dynamic";

type IntegrationExecutionMode =
  | "runtime"
  | "chatgpt-hosted"
  | "catalog-only";

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

function statusDescription(
  status: "catalogued" | "connected" | "error",
  executionMode: IntegrationExecutionMode,
) {
  if (executionMode === "chatgpt-hosted") {
    return "Disponível no ChatGPT; o site não possui uma API oficial para invocação direta.";
  }
  switch (status) {
    case "connected":
      return "A conexão externa foi verificada em runtime.";
    case "error":
      return "A conexão externa falhou na última verificação.";
    default:
      return executionMode === "runtime"
        ? "O adapter de runtime existe; a conexão de conta é verificada no contexto autenticado."
        : "O nome está no catálogo, mas nenhuma conexão externa foi verificada.";
  }
}

const nvidiaSkillById = new Map(
  NVIDIA_PHYSICAL_AI_SKILLS.map((skill) => [skill.id, skill]),
);

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
          Um centro único para descobrir capacidades do ecossistema, distinguir
          conexões reais de catálogo e transformar ferramentas em fluxos do produto.
        </p>
      </header>

      <section
        aria-labelledby="mestre-arcano-title"
        style={{ marginTop: "var(--aa-spacing-lg)" }}
      >
        <article className="aa-card aa-card-elevated">
          <p
            style={{
              color: "var(--aa-accent-primary)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
            }}
          >
            OpenAI Agents
          </p>
          <h2 id="mestre-arcano-title" style={{ marginTop: 0 }}>
            Mestre Arcano
          </h2>
          <p style={{ color: "var(--aa-text-secondary)" }}>
            Agente educacional executado no servidor da Academia Arcana. A chave
            permanece fora do navegador e a conexão só é marcada como verificada
            após uma checagem real do modelo configurado.
          </p>
          {snapshot.runtimeIntegrations.map((integration) => (
            <div key={integration.providerId}>
              <strong>
                {integration.status === "connected"
                  ? "Conectado"
                  : integration.status === "not_configured"
                    ? "Aguardando configuração"
                    : "Erro na conexão"}
              </strong>
              <span
                style={{
                  color: "var(--aa-text-secondary)",
                  display: "block",
                  marginTop: "0.35rem",
                }}
              >
                Modelo: {integration.model ?? "não definido"}
              </span>
            </div>
          ))}
          <a
            className="aa-button aa-button-secondary"
            href="https://platform.openai.com/agents"
            rel="noreferrer"
            target="_blank"
          >
            Abrir OpenAI Agents
          </a>
        </article>
      </section>

      <section
        aria-labelledby="todoist-title"
        style={{ marginTop: "var(--aa-spacing-lg)" }}
      >
        <article className="aa-card aa-card-elevated">
          <p
            style={{
              color: "var(--aa-accent-primary)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
            }}
          >
            Produtividade · Planejamento
          </p>
          <h2 id="todoist-title" style={{ marginTop: 0 }}>
            Todoist
          </h2>
          <p style={{ color: "var(--aa-text-secondary)" }}>
            Conecte sua conta para levar tarefas, prazos e execução do cronograma
            para o Todoist. A autenticação acontece no servidor e a Academia Arcana
            mantém o controle do progresso educacional.
          </p>
          <Link className="aa-button aa-button-primary" href="/integracoes/todoist">
            Gerenciar conexão do Todoist
          </Link>
        </article>
      </section>

      <section
        aria-labelledby="notion-title"
        style={{ marginTop: "var(--aa-spacing-lg)" }}
      >
        <article className="aa-card aa-card-elevated">
          <p
            style={{
              color: "var(--aa-accent-primary)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
            }}
          >
            Conhecimento · Documentação
          </p>
          <h2 id="notion-title" style={{ marginTop: 0 }}>
            Notion
          </h2>
          <p style={{ color: "var(--aa-text-secondary)" }}>
            Conecte seu workspace para pesquisar páginas autorizadas e criar
            páginas-filhas. O Notion funciona como camada de conhecimento,
            documentação e governança; o estado transacional da plataforma
            permanece no Supabase.
          </p>
          <Link className="aa-button aa-button-primary" href="/integracoes/notion">
            Gerenciar conexão do Notion
          </Link>
        </article>
      </section>

      <section
        aria-labelledby="trello-title"
        style={{ marginTop: "var(--aa-spacing-lg)" }}
      >
        <article className="aa-card aa-card-elevated">
          <p
            style={{
              color: "var(--aa-accent-primary)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
            }}
          >
            Atlassian · Planejamento
          </p>
          <h2 id="trello-title" style={{ marginTop: 0 }}>
            Trello
          </h2>
          <p style={{ color: "var(--aa-text-secondary)" }}>
            Conecte sua conta para organizar quadros, listas, cartões e checklists
            do fluxo operacional. A autenticação ocorre no servidor e a Academia
            Arcana continua sendo a fonte de verdade educacional.
          </p>
          <Link className="aa-button aa-button-primary" href="/integracoes/trello">
            Gerenciar conexão do Trello
          </Link>
        </article>
      </section>

      <section
        aria-labelledby="microsoft-sharepoint-title"
        style={{ marginTop: "var(--aa-spacing-lg)" }}
      >
        <article className="aa-card aa-card-elevated">
          <p
            style={{
              color: "var(--aa-accent-primary)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
            }}
          >
            Microsoft · Documentos
          </p>
          <h2 id="microsoft-sharepoint-title" style={{ marginTop: 0 }}>
            SharePoint / OneDrive
          </h2>
          <p style={{ color: "var(--aa-text-secondary)" }}>
            Conecte sua conta Microsoft para pesquisar e consultar documentos,
            metadados, pastas e versões como fonte externa dos Grimórios e do
            Mestre Arcano. A integração é somente leitura nesta primeira etapa.
          </p>
          <Link className="aa-button aa-button-primary" href="/integracoes/microsoft-sharepoint">
            Gerenciar SharePoint
          </Link>
        </article>
      </section>

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
        aria-labelledby="tool-tracks-title"
        style={{
          display: "grid",
          gap: "var(--aa-spacing-md)",
          marginTop: "var(--aa-spacing-xl)",
        }}
      >
        <div>
          <p
            style={{
              color: "var(--aa-accent-primary)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
            }}
          >
            Orquestração
          </p>
          <h2 id="tool-tracks-title" style={{ marginTop: 0 }}>
            Ferramentas aplicadas ao ciclo de criação
          </h2>
          <p style={{ color: "var(--aa-text-secondary)", maxWidth: "55rem" }}>
            As capacidades abaixo funcionam como trilhas de engenharia e produto.
            O mapa não transforma automaticamente plugins do ChatGPT em APIs do site;
            ele documenta onde cada ferramenta agrega valor no processo de construção.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: "var(--aa-spacing-md)",
            gridTemplateColumns: "repeat(auto-fit, minmax(18rem, 1fr))",
          }}
        >
          {ARCANA_TOOL_TRACKS.map((track) => (
            <article key={track.title} className="aa-card aa-card-default">
              <h3 style={{ marginTop: 0 }}>{track.title}</h3>
              <p style={{ color: "var(--aa-text-secondary)" }}>
                {track.description}
              </p>
              <ul
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                }}
              >
                {track.tools.map((tool) => (
                  <li
                    key={tool}
                    style={{
                      border: "1px solid var(--aa-border-default)",
                      borderRadius: 999,
                      padding: "0.35rem 0.6rem",
                    }}
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="nvidia-title"
        style={{
          display: "grid",
          gap: "var(--aa-spacing-md)",
          marginTop: "var(--aa-spacing-xl)",
        }}
      >
        <div className="aa-card aa-card-elevated">
          <p
            style={{
              color: "var(--aa-accent-primary)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
            }}
          >
            NVIDIA · Physical AI
          </p>
          <h2 id="nvidia-title" style={{ marginTop: 0 }}>
            Laboratório de simulação e robótica
          </h2>
          <p style={{ color: "var(--aa-text-secondary)", maxWidth: "58rem" }}>
            O catálogo oficial da NVIDIA reúne skills para simulação robótica,
            dados sintéticos, treinamento, validação, OpenUSD e infraestrutura.
            Nesta etapa a Academia Arcana registra essas capacidades como uma
            trilha de desenvolvimento; nenhuma integração de hardware ou API é
            declarada como ativa sem uma conexão verificável.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <a
              className="aa-button aa-button-secondary"
              href="https://github.com/NVIDIA/skills"
              rel="noreferrer"
              target="_blank"
            >
              Catálogo NVIDIA Skills
            </a>
            <a
              className="aa-button aa-button-secondary"
              href="https://github.com/isaac-sim/IsaacSim"
              rel="noreferrer"
              target="_blank"
            >
              Isaac Sim
            </a>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "var(--aa-spacing-md)",
            gridTemplateColumns: "repeat(auto-fit, minmax(18rem, 1fr))",
          }}
        >
          {NVIDIA_PHYSICAL_AI_TRACKS.map((track) => (
            <article key={track.title} className="aa-card aa-card-default">
              <h3 style={{ marginTop: 0 }}>{track.title}</h3>
              <p style={{ color: "var(--aa-text-secondary)" }}>
                {track.description}
              </p>
              <ul style={{ marginBottom: 0 }}>
                {track.skills.map((skillId) => {
                  const skill = nvidiaSkillById.get(skillId);
                  if (!skill) return null;

                  return (
                    <li key={skill.id} style={{ marginBottom: "0.7rem" }}>
                      <a
                        href={skill.catalogUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {skill.name}
                      </a>
                      <span
                        style={{
                          color: "var(--aa-text-secondary)",
                          display: "block",
                          fontSize: "0.9rem",
                        }}
                      >
                        {skill.workflow}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="integrations-list-title"
        style={{
          display: "grid",
          gap: "var(--aa-spacing-sm)",
          marginTop: "var(--aa-spacing-xl)",
        }}
      >
        <div>
          <h2 id="integrations-list-title">Plugins do catálogo</h2>
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
                <span
                  aria-label={statusDescription(
                    entry.status,
                    entry.executionMode,
                  )}
                >
                  {entry.executionMode === "chatgpt-hosted"
                    ? "Hospedado no ChatGPT"
                    : statusLabel(entry.status)}
                </span>
              </div>
              <p
                style={{
                  color: "var(--aa-text-secondary)",
                  marginBottom: 0,
                }}
              >
                {statusDescription(entry.status, entry.executionMode)}
              </p>
              {entry.chatgptAppUrl && (
                <a
                  className="aa-button aa-button-secondary"
                  href={entry.chatgptAppUrl}
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--aa-spacing-sm)" }}>
          <Link className="aa-button aa-button-primary" href="/integracoes/ia-aberta">
            Laboratório de IA aberta
          </Link>
          <Link className="aa-button aa-button-secondary" href="/">
            Voltar ao início
          </Link>
        </div>
      </nav>
    </main>
  );
}
