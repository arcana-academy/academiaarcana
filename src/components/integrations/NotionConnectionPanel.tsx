"use client";

import { useEffect, useState } from "react";
import { BookOpen, ExternalLink, FilePlus2, RefreshCw, Unplug } from "lucide-react";

type NotionStatus =
  | { status: "disconnected" }
  | {
      status: "connected";
      user?: { id?: string; name?: string | null; type?: string | null };
      workspace?: { id?: string | null; name?: string | null };
      verifiedAt?: string;
    }
  | { status: "reauthorization_required" };

type NotionSearchResult = {
  id: string;
  title: string;
  url: string | null;
  lastEditedTime: string | null;
};

export function NotionConnectionPanel() {
  const [status, setStatus] = useState<NotionStatus>({ status: "disconnected" });
  const [results, setResults] = useState<NotionSearchResult[]>([]);
  const [query, setQuery] = useState("");
  const [parentPageId, setParentPageId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/notion/status", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error();
      setStatus((await response.json()) as NotionStatus);
    } catch {
      setError("Não foi possível consultar o estado do Notion.");
    } finally {
      setLoading(false);
    }
  };

  const searchPages = async () => {
    setSearching(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/integrations/notion/pages?query=${encodeURIComponent(query)}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as {
        status: NotionStatus["status"] | "request_failed";
        results?: NotionSearchResult[];
      };
      if (data.status === "reauthorization_required") {
        setStatus({ status: "reauthorization_required" });
        setResults([]);
        return;
      }
      if (!response.ok) throw new Error();
      setResults(data.results ?? []);
    } catch {
      setError("Não foi possível pesquisar as páginas do Notion.");
    } finally {
      setSearching(false);
    }
  };

  const createPage = async () => {
    const normalizedParent = parentPageId.trim();
    const normalizedTitle = title.trim();
    if (!normalizedParent || !normalizedTitle) return;

    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/notion/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentPageId: normalizedParent,
          title: normalizedTitle,
          body,
        }),
      });
      const data = (await response.json()) as
        | { id: string; title: string; url: string | null }
        | { error?: string };

      if (response.status === 401) {
        setStatus({ status: "reauthorization_required" });
        throw new Error();
      }
      if (!response.ok || !("id" in data)) throw new Error();

      setTitle("");
      setBody("");
      await searchPages();
    } catch {
      setError("Não foi possível criar a página no Notion.");
    } finally {
      setCreating(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/notion/disconnect", {
        method: "POST",
      });
      if (!response.ok) throw new Error();
      setStatus({ status: "disconnected" });
      setResults([]);
    } catch {
      setError("Não foi possível desconectar o Notion.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStatus(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <section className="aa-surface" aria-busy="true">
        <p>Consultando conexão do Notion…</p>
      </section>
    );
  }

  return (
    <section className="aa-surface" aria-labelledby="notion-connection-title">
      <div className="aa-surface-header">
        <div>
          <p className="aa-eyebrow">Conhecimento · documentação</p>
          <h2 id="notion-connection-title">Notion conectado</h2>
        </div>
        <button
          type="button"
          className="aa-button aa-button-secondary aa-button-sm"
          onClick={() => void loadStatus()}
          disabled={busy || searching || creating}
        >
          <RefreshCw size={16} aria-hidden="true" />Atualizar
        </button>
      </div>

      {status.status === "disconnected" ? (
        <div className="aa-empty">
          <p>
            Conecte o workspace para usar páginas autorizadas como camada de
            conhecimento e documentação.
          </p>
          <a
            className="aa-button aa-button-primary"
            href="/api/integrations/notion/connect"
          >
            Conectar Notion
          </a>
        </div>
      ) : status.status === "reauthorization_required" ? (
        <div className="aa-empty">
          <p>A autorização do Notion precisa ser refeita.</p>
          <a
            className="aa-button aa-button-primary"
            href="/api/integrations/notion/connect"
          >
            Reconectar Notion
          </a>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: "var(--aa-spacing-xs)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--aa-spacing-sm)", alignItems: "center" }}>
              <BookOpen size={20} aria-hidden="true" />
              <strong>Conectado</strong>
              {status.workspace?.name ? <span>{status.workspace.name}</span> : null}
            </div>
            {status.user?.name ? (
              <p className="aa-state-copy" style={{ margin: 0 }}>
                Usuário autorizado: {status.user.name}
              </p>
            ) : null}
          </div>

          <div style={{ marginTop: "var(--aa-spacing-lg)" }}>
            <div className="aa-surface-header">
              <div>
                <p className="aa-eyebrow">Pesquisa autorizada</p>
                <h3 style={{ marginTop: 0 }}>Encontrar páginas</h3>
              </div>
            </div>
            <div className="aa-planning-form-row">
              <div className="aa-field" style={{ flex: 1 }}>
                <label htmlFor="notion-search">Pesquisar</label>
                <input
                  id="notion-search"
                  className="aa-input"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ex.: roadmap, decisões, QA"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void searchPages();
                  }}
                />
              </div>
              <button
                className="aa-button aa-button-secondary"
                type="button"
                onClick={() => void searchPages()}
                disabled={searching}
              >
                {searching ? "Pesquisando…" : "Pesquisar"}
              </button>
            </div>

            {results.length > 0 ? (
              <ul className="aa-list" style={{ marginTop: "var(--aa-spacing-md)" }}>
                {results.map((result) => (
                  <li className="aa-list-item" key={result.id}>
                    <div>
                      <strong>{result.title}</strong>
                      {result.lastEditedTime ? (
                        <small>
                          Atualizada:{" "}
                          {new Date(result.lastEditedTime).toLocaleDateString()}
                        </small>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--aa-spacing-sm)" }}>
                      <button
                        className="aa-button aa-button-secondary aa-button-sm"
                        type="button"
                        onClick={() => setParentPageId(result.id)}
                      >
                        Usar como página pai
                      </button>
                      {result.url ? (
                        <a
                          className="aa-button aa-button-secondary aa-button-sm"
                          href={result.url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Abrir ${result.title} no Notion`}
                        >
                          <ExternalLink size={16} aria-hidden="true" />Abrir
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div style={{ marginTop: "var(--aa-spacing-lg)" }}>
            <div className="aa-surface-header">
              <div>
                <p className="aa-eyebrow">Escrita controlada</p>
                <h3 style={{ marginTop: 0 }}>Criar página</h3>
              </div>
            </div>
            <div className="aa-field">
              <label htmlFor="notion-parent-page">Página pai</label>
              <input
                id="notion-parent-page"
                className="aa-input"
                value={parentPageId}
                onChange={(event) => setParentPageId(event.target.value)}
                placeholder="Selecione uma página nos resultados"
              />
            </div>
            <div className="aa-field" style={{ marginTop: "var(--aa-spacing-sm)" }}>
              <label htmlFor="notion-page-title">Título</label>
              <input
                id="notion-page-title"
                className="aa-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Nota de estudo"
              />
            </div>
            <div className="aa-field" style={{ marginTop: "var(--aa-spacing-sm)" }}>
              <label htmlFor="notion-page-body">Conteúdo inicial</label>
              <textarea
                id="notion-page-body"
                className="aa-input"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={5}
                placeholder="Conteúdo inicial opcional"
              />
            </div>
            <button
              type="button"
              className="aa-button aa-button-primary"
              style={{ marginTop: "var(--aa-spacing-sm)" }}
              onClick={() => void createPage()}
              disabled={creating || !parentPageId.trim() || !title.trim()}
            >
              <FilePlus2 size={16} aria-hidden="true" />
              {creating ? "Criando…" : "Criar página"}
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "var(--aa-spacing-lg)" }}>
            <a
              className="aa-button aa-button-secondary"
              href="https://www.notion.so/"
              target="_blank"
              rel="noreferrer"
            >
              Abrir Notion
            </a>
            <button
              type="button"
              className="aa-button aa-button-secondary"
              onClick={() => void disconnect()}
              disabled={busy || searching || creating}
            >
              <Unplug size={16} aria-hidden="true" />
              {busy ? "Desconectando…" : "Desconectar"}
            </button>
          </div>
        </>
      )}

      {error ? (
        <p role="alert" className="aa-field-error">
          {error}
        </p>
      ) : null}
    </section>
  );
}
