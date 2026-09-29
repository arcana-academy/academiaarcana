"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Library,
  LogOut,
  RefreshCw,
  Search,
  Server,
} from "lucide-react";

type ConnectionStatus =
  | { status: "disconnected" }
  | { status: "connected"; providerId?: string; verifiedAt?: string }
  | { status: "reauthorization_required"; providerId?: string };

type Site = { id: string; name?: string; displayName?: string; webUrl?: string };
type Drive = { id: string; name?: string; driveType?: string; webUrl?: string };
type SearchItem = {
  id: string;
  name?: string;
  webUrl?: string;
  size?: number;
  lastModifiedDateTime?: string;
  file?: { mimeType?: string } | null;
  folder?: Record<string, unknown> | null;
};

type Source = {
  providerId: string;
  type: "external_document";
  name: string | null;
  mimeType: string | null;
  webUrl: string | null;
  lastModifiedDateTime: string | null;
  size: number | null;
  siteId: string;
  driveId: string;
  itemId: string;
  id?: string;
};

type GraphEnvelope = { output?: { value?: unknown[] } };

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const body = (await response.json().catch(() => null)) as T | { error?: string } | null;
  if (!response.ok) {
    throw new Error(body && typeof body === "object" && "error" in body ? body.error : "request_failed");
  }
  return body as T;
}

function itemsFromEnvelope(body: GraphEnvelope | null): Record<string, unknown>[] {
  return Array.isArray(body?.output?.value)
    ? body.output.value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    : [];
}

function normalizeSite(item: Record<string, unknown>): Site {
  return {
    id: String(item.id ?? ""),
    name: typeof item.name === "string" ? item.name : undefined,
    displayName: typeof item.displayName === "string" ? item.displayName : undefined,
    webUrl: typeof item.webUrl === "string" ? item.webUrl : undefined,
  };
}

function normalizeDrive(item: Record<string, unknown>): Drive {
  return {
    id: String(item.id ?? ""),
    name: typeof item.name === "string" ? item.name : undefined,
    driveType: typeof item.driveType === "string" ? item.driveType : undefined,
    webUrl: typeof item.webUrl === "string" ? item.webUrl : undefined,
  };
}

function normalizeSearchItem(item: Record<string, unknown>): SearchItem {
  return {
    id: String(item.id ?? ""),
    name: typeof item.name === "string" ? item.name : undefined,
    webUrl: typeof item.webUrl === "string" ? item.webUrl : undefined,
    size: typeof item.size === "number" ? item.size : undefined,
    lastModifiedDateTime:
      typeof item.lastModifiedDateTime === "string" ? item.lastModifiedDateTime : undefined,
    file:
      item.file && typeof item.file === "object"
        ? (item.file as { mimeType?: string })
        : null,
    folder: item.folder && typeof item.folder === "object" ? (item.folder as Record<string, unknown>) : null,
  };
}

function formatSize(size?: number) {
  if (typeof size !== "number") return null;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function MicrosoftSharePointConnectionPanel() {
  const [status, setStatus] = useState<ConnectionStatus>({ status: "disconnected" });
  const [sites, setSites] = useState<Site[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedDrive, setSelectedDrive] = useState("");
  const [query, setQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [savedSources, setSavedSources] = useState<Array<Source & { id: string; status?: string; created_at?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const site = useMemo(() => sites.find((item) => item.id === selectedSite), [sites, selectedSite]);
  const drive = useMemo(() => drives.find((item) => item.id === selectedDrive), [drives, selectedDrive]);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getJson<ConnectionStatus>("/api/integrations/microsoft-sharepoint/status");
      setStatus(next);
      if (next.status === "connected") {
        const [body, saved] = await Promise.all([
          getJson<GraphEnvelope>("/api/integrations/microsoft-sharepoint/sites"),
          getJson<{ sources?: Array<Source & { id: string; status?: string; created_at?: string }> }>("/api/integrations/microsoft-sharepoint/sources"),
        ]);
        setSites(itemsFromEnvelope(body).map(normalizeSite).filter((item) => item.id));
        setSavedSources(saved.sources ?? []);
      } else {
        setSites([]);
        setDrives([]);
        setItems([]);
        setSavedSources([]);
        setSelectedSite("");
        setSelectedDrive("");
      }
    } catch {
      setError("Não foi possível verificar a conexão Microsoft.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStatus(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!selectedSite) {
      setDrives([]);
      setSelectedDrive("");
      setItems([]);
      return;
    }

    const loadDrives = async () => {
      setBusy(true);
      setError(null);
      try {
        const body = await getJson<GraphEnvelope>(
          `/api/integrations/microsoft-sharepoint/drives?siteId=${encodeURIComponent(selectedSite)}`,
        );
        setDrives(itemsFromEnvelope(body).map(normalizeDrive).filter((item) => item.id));
        setSelectedDrive("");
        setItems([]);
        setSelectedSource(null);
      } catch {
        setError("Não foi possível carregar as bibliotecas deste site.");
      } finally {
        setBusy(false);
      }
    };
    void loadDrives();
  }, [selectedSite]);

  const search = async () => {
    const normalizedQuery = query.trim();
    if (!selectedSite || !selectedDrive || !normalizedQuery) return;
    setBusy(true);
    setError(null);
    try {
      const body = await getJson<GraphEnvelope>(
        `/api/integrations/microsoft-sharepoint/search?siteId=${encodeURIComponent(selectedSite)}&driveId=${encodeURIComponent(selectedDrive)}&q=${encodeURIComponent(normalizedQuery)}`,
      );
      setItems(itemsFromEnvelope(body).map(normalizeSearchItem).filter((item) => item.id));
      setSelectedSource(null);
    } catch {
      setError("Não foi possível pesquisar nesta biblioteca.");
    } finally {
      setBusy(false);
    }
  };

  const selectSource = async (item: SearchItem) => {
    if (!selectedSite || !selectedDrive || !item.id) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/microsoft-sharepoint/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: selectedSite, driveId: selectedDrive, itemId: item.id }),
      });
      const body = (await response.json().catch(() => null)) as { source?: Source & { id?: string }; error?: string } | null;
      if (!response.ok || !body?.source) throw new Error(body?.error ?? "source_save_failed");
      setSelectedSource(body.source);
      setSavedSources((current) => [body.source as Source & { id: string }, ...current.filter((source) => source.id !== (body.source as Source & { id: string }).id)]);
    } catch {
      setError("Não foi possível preparar este documento como fonte.");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/microsoft-sharepoint/disconnect", { method: "POST" });
      if (!response.ok) throw new Error();
      setStatus({ status: "disconnected" });
      setSites([]);
      setDrives([]);
      setItems([]);
      setSelectedSite("");
      setSelectedDrive("");
      setSelectedSource(null);
      setSavedSources([]);
    } catch {
      setError("Não foi possível desconectar a conta Microsoft.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <section className="aa-surface" aria-busy="true"><p>Consultando conexão Microsoft…</p></section>;
  }

  return (
    <section className="aa-surface" aria-labelledby="microsoft-sharepoint-connection-title">
      <div className="aa-surface-header">
        <div>
          <p className="aa-eyebrow">Microsoft Graph · somente leitura</p>
          <h2 id="microsoft-sharepoint-connection-title">Fonte de documentos</h2>
        </div>
        <button
          type="button"
          className="aa-button aa-button-secondary aa-button-sm"
          onClick={() => void loadStatus()}
          disabled={busy}
        >
          <RefreshCw size={16} aria-hidden="true" /> Atualizar
        </button>
      </div>

      {status.status === "disconnected" ? (
        <div className="aa-empty">
          <p>Conecte sua conta Microsoft para navegar por sites e bibliotecas autorizados.</p>
          <a className="aa-button aa-button-primary" href="/api/integrations/microsoft-sharepoint/connect">
            Conectar Microsoft
          </a>
        </div>
      ) : status.status === "reauthorization_required" ? (
        <div className="aa-empty">
          <p>A autorização Microsoft precisa ser refeita antes de consultar seus documentos.</p>
          <a className="aa-button aa-button-primary" href="/api/integrations/microsoft-sharepoint/connect">
            Reconectar Microsoft
          </a>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <CheckCircle2 size={18} aria-hidden="true" />
            <strong>Conta Microsoft conectada</strong>
            {status.verifiedAt ? <span className="aa-state-copy">verificada em {new Date(status.verifiedAt).toLocaleString("pt-BR")}</span> : null}
          </div>

          <div className="aa-planning-form" style={{ marginTop: "var(--aa-spacing-lg)" }}>
            <div className="aa-surface-header">
              <div><p className="aa-eyebrow">1 · Localização</p><h3>Escolha o site</h3></div>
              <Server size={20} aria-hidden="true" />
            </div>
            <div className="aa-field">
              <label htmlFor="sharepoint-site">Site do SharePoint</label>
              <select id="sharepoint-site" className="aa-input" value={selectedSite} onChange={(event) => setSelectedSite(event.target.value)} disabled={busy}>
                <option value="">Selecione um site…</option>
                {sites.map((item) => <option key={item.id} value={item.id}>{item.displayName ?? item.name ?? item.id}</option>)}
              </select>
            </div>
            {site?.webUrl ? <a href={site.webUrl} target="_blank" rel="noreferrer" className="aa-button aa-button-secondary aa-button-sm" style={{ marginTop: "0.75rem" }}><ExternalLink size={16} aria-hidden="true" /> Abrir site</a> : null}
          </div>

          {selectedSite ? (
            <div className="aa-planning-form" style={{ marginTop: "var(--aa-spacing-lg)" }}>
              <div className="aa-surface-header">
                <div><p className="aa-eyebrow">2 · Biblioteca</p><h3>Escolha a biblioteca de documentos</h3></div>
                <Library size={20} aria-hidden="true" />
              </div>
              <div className="aa-field">
                <label htmlFor="sharepoint-drive">Biblioteca</label>
                <select id="sharepoint-drive" className="aa-input" value={selectedDrive} onChange={(event) => { setSelectedDrive(event.target.value); setItems([]); setSelectedSource(null); }} disabled={busy}>
                  <option value="">Selecione uma biblioteca…</option>
                  {drives.map((item) => <option key={item.id} value={item.id}>{item.name ?? item.id}{item.driveType ? ` · ${item.driveType}` : ""}</option>)}
                </select>
              </div>
              {drive?.webUrl ? <a href={drive.webUrl} target="_blank" rel="noreferrer" className="aa-button aa-button-secondary aa-button-sm" style={{ marginTop: "0.75rem" }}><ExternalLink size={16} aria-hidden="true" /> Abrir biblioteca</a> : null}
            </div>
          ) : null}

          {selectedDrive ? (
            <div className="aa-planning-form" style={{ marginTop: "var(--aa-spacing-lg)" }}>
              <div className="aa-surface-header">
                <div><p className="aa-eyebrow">3 · Pesquisa</p><h3>Encontre documentos</h3></div>
                <Search size={20} aria-hidden="true" />
              </div>
              <div className="aa-planning-form-row">
                <div className="aa-field" style={{ flex: 1 }}>
                  <label htmlFor="sharepoint-query">Termo de pesquisa</label>
                  <input
                    id="sharepoint-query"
                    className="aa-input"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter") void search(); }}
                    placeholder="Ex.: plano de estudos"
                    disabled={busy}
                  />
                </div>
                <button className="aa-button aa-button-primary" type="button" onClick={() => void search()} disabled={busy || !query.trim()}>
                  <Search size={16} aria-hidden="true" /> {busy ? "Pesquisando…" : "Pesquisar"}
                </button>
              </div>
            </div>
          ) : null}

          {items.length > 0 ? (
            <div style={{ marginTop: "var(--aa-spacing-lg)" }}>
              <div className="aa-surface-header">
                <div><p className="aa-eyebrow">Resultados</p><h3>Documentos encontrados</h3></div>
                <span className="aa-badge aa-badge-neutral">{items.length}</span>
              </div>
              <ul className="aa-list">
                {items.map((item) => (
                  <li className="aa-list-item" key={item.id}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: "block" }}>{item.name ?? item.id}</strong>
                      <small>
                        <FileText size={14} aria-hidden="true" />
                        {item.file?.mimeType ?? (item.folder ? "Pasta" : "Documento")}
                        {formatSize(item.size) ? ` · ${formatSize(item.size)}` : ""}
                        {item.lastModifiedDateTime ? ` · ${new Date(item.lastModifiedDateTime).toLocaleDateString("pt-BR")}` : ""}
                      </small>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {item.webUrl ? <a className="aa-button aa-button-secondary aa-button-sm" href={item.webUrl} target="_blank" rel="noreferrer" aria-label={`Abrir ${item.name ?? "documento"} no SharePoint`}><ExternalLink size={16} aria-hidden="true" /> Abrir</a> : null}
                      <button className="aa-button aa-button-primary aa-button-sm" type="button" onClick={() => void selectSource(item)} disabled={busy}>
                        <FileText size={16} aria-hidden="true" /> Usar como fonte
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {selectedSource ? (
            <aside className="aa-card aa-card-default" aria-labelledby="sharepoint-source-title" style={{ marginTop: "var(--aa-spacing-lg)" }}>
              <p className="aa-eyebrow">Fonte selecionada</p>
              <h3 id="sharepoint-source-title">{selectedSource.name ?? "Documento Microsoft"}</h3>
              <p style={{ color: "var(--aa-text-secondary)" }}>
                Esta fonte foi registrada no seu workspace com RLS. O navegador recebe apenas metadados; o token Microsoft permanece no servidor.
              </p>
              {selectedSource.id ? <p className="aa-state-copy">Fonte registrada: {selectedSource.id}</p> : null}
              <dl style={{ display: "grid", gap: "0.5rem" }}>
                <div><dt><strong>Tipo</strong></dt><dd>{selectedSource.mimeType ?? "não informado"}</dd></div>
                <div><dt><strong>Tamanho</strong></dt><dd>{formatSize(selectedSource.size ?? undefined) ?? "não informado"}</dd></div>
              </dl>
              {selectedSource.webUrl ? <a className="aa-button aa-button-secondary" href={selectedSource.webUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" /> Abrir documento</a> : null}
            </aside>
          ) : null}

          {savedSources.length > 0 ? (
            <section aria-labelledby="sharepoint-saved-sources-title" style={{ marginTop: "var(--aa-spacing-lg)" }}>
              <div className="aa-surface-header">
                <div><p className="aa-eyebrow">Fontes persistidas</p><h3 id="sharepoint-saved-sources-title">Seu acervo conectado</h3></div>
                <span className="aa-badge aa-badge-neutral">{savedSources.length}</span>
              </div>
              <ul className="aa-list">
                {savedSources.map((source) => (
                  <li className="aa-list-item" key={source.id}>
                    <div><strong>{source.name ?? "Documento Microsoft"}</strong><small>{source.mimeType ?? "Tipo não informado"} · {source.status ?? "active"}</small></div>
                    {source.webUrl ? <a className="aa-button aa-button-secondary aa-button-sm" href={source.webUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" /> Abrir</a> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "var(--aa-spacing-lg)" }}>
            <a className="aa-button aa-button-secondary" href="https://www.office.com/" target="_blank" rel="noreferrer">Abrir Microsoft 365</a>
            <button type="button" className="aa-button aa-button-secondary" onClick={() => void disconnect()} disabled={busy}>
              <LogOut size={16} aria-hidden="true" /> Desconectar Microsoft
            </button>
          </div>
        </>
      )}

      {error ? <p role="alert" className="aa-field-error">{error === "microsoft_sharepoint_reauthorization_required" ? "A autorização Microsoft expirou. Reconecte a conta." : "Não foi possível concluir esta operação. Tente novamente."}</p> : null}
    </section>
  );
}
