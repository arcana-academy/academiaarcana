"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  CheckCircle2,
  ExternalLink,
  ListPlus,
  Plus,
  RefreshCw,
  Search,
  Unplug,
} from "lucide-react";

type TrelloBoard = { id: string; name: string; url: string; closed: boolean };
type TrelloList = { id: string; idBoard: string; name: string; pos: number; closed: boolean };
type TrelloCard = {
  id: string;
  idBoard: string;
  idList: string;
  name: string;
  due?: string | null;
  closed: boolean;
  pos: number;
  url: string;
};

type TrelloStatus =
  | { status: "disconnected" }
  | {
      status: "connected";
      user?: { fullName?: string; username?: string; email?: string };
    }
  | { status: "reauthorization_required" };

type BoardData = {
  status: "connected";
  board: TrelloBoard & { desc?: string };
  lists: TrelloList[];
  cards: TrelloCard[];
};

type SearchData = { cards?: TrelloCard[]; boards?: TrelloBoard[] };

export function TrelloConnectionPanel() {
  const [status, setStatus] = useState<TrelloStatus>({ status: "disconnected" });
  const [boards, setBoards] = useState<TrelloBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [listName, setListName] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardListId, setCardListId] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = async (boardId: string) => {
    if (!boardId) {
      setBoardData(null);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/integrations/trello/boards/${encodeURIComponent(boardId)}`,
        { cache: "no-store" },
      );

      if (response.status === 401) {
        setStatus({ status: "reauthorization_required" });
        return;
      }
      if (!response.ok) throw new Error();

      const data = (await response.json()) as BoardData;
      setBoardData(data);
      setCardListId(data.lists[0]?.id ?? "");
    } catch {
      setError("Não foi possível carregar o board selecionado.");
    } finally {
      setBusy(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/trello/status", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error();

      const nextStatus = (await response.json()) as TrelloStatus;
      setStatus(nextStatus);

      if (nextStatus.status === "connected") {
        const boardsResponse = await fetch(
          "/api/integrations/trello/boards",
          { cache: "no-store" },
        );

        if (!boardsResponse.ok) {
          if (boardsResponse.status === 401) {
            setStatus({ status: "reauthorization_required" });
            setBoards([]);
            return;
          }
          throw new Error();
        }

        const data = (await boardsResponse.json()) as {
          boards?: TrelloBoard[];
        };
        const nextBoards = data.boards ?? [];
        setBoards(nextBoards);
        setSelectedBoardId((current) =>
          current && nextBoards.some((board) => board.id === current)
            ? current
            : nextBoards[0]?.id ?? "",
        );
      } else {
        setBoards([]);
        setBoardData(null);
      }
    } catch {
      setError("Não foi possível consultar a conexão do Trello.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!selectedBoardId || status.status !== "connected") return;

    const timer = window.setTimeout(() => {
      void loadBoard(selectedBoardId);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedBoardId, status.status]);

  const cardsByList = useMemo(() => {
    const grouped = new Map<string, TrelloCard[]>();
    for (const card of boardData?.cards ?? []) {
      grouped.set(card.idList, [...(grouped.get(card.idList) ?? []), card]);
    }
    return grouped;
  }, [boardData?.cards]);

  const createBoard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!boardName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/trello/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: boardName }),
      });
      const body = (await response.json().catch(() => null)) as TrelloBoard | null;
      if (!response.ok || !body?.id) throw new Error();

      setBoards((current) => [body, ...current]);
      setSelectedBoardId(body.id);
      setBoardName("");
    } catch {
      setError("Não foi possível criar o board no Trello.");
    } finally {
      setCreating(false);
    }
  };

  const createList = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBoardId || !listName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/trello/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: selectedBoardId, name: listName }),
      });
      if (!response.ok) throw new Error();

      setListName("");
      await loadBoard(selectedBoardId);
    } catch {
      setError("Não foi possível criar a lista no Trello.");
    } finally {
      setCreating(false);
    }
  };

  const createCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cardListId || !cardName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/trello/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: cardListId, name: cardName }),
      });
      if (!response.ok) throw new Error();

      setCardName("");
      await loadBoard(selectedBoardId);
    } catch {
      setError("Não foi possível criar o card no Trello.");
    } finally {
      setCreating(false);
    }
  };

  const completeCard = async (cardId: string) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/trello/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, closed: true }),
      });
      if (!response.ok) throw new Error();

      await loadBoard(selectedBoardId);
    } catch {
      setError("Não foi possível concluir o card no Trello.");
    } finally {
      setBusy(false);
    }
  };

  const search = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/integrations/trello/cards?query=${encodeURIComponent(value)}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error();

      setSearchResults((await response.json()) as SearchData);
    } catch {
      setError("Não foi possível pesquisar no Trello.");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/trello/disconnect", {
        method: "POST",
      });
      if (!response.ok) throw new Error();

      setStatus({ status: "disconnected" });
      setBoards([]);
      setBoardData(null);
      setSelectedBoardId("");
      setSearchResults(null);
    } catch {
      setError("Não foi possível desconectar o Trello.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <section className="aa-surface" aria-busy="true">
        <p>Consultando conexão do Trello…</p>
      </section>
    );
  }

  return (
    <section className="aa-surface" aria-labelledby="trello-connection-title">
      <div className="aa-surface-header">
        <div>
          <p className="aa-eyebrow">Operações · workflow</p>
          <h2 id="trello-connection-title">Trello conectado</h2>
        </div>
        <button
          type="button"
          className="aa-button aa-button-secondary aa-button-sm"
          onClick={() => void load()}
          disabled={busy || creating}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Atualizar
        </button>
      </div>

      {status.status === "disconnected" ? (
        <div className="aa-empty">
          <p>
            Conecte sua conta para administrar o Trello pela camada operacional
            da Academia Arcana.
          </p>
          <a
            className="aa-button aa-button-primary"
            href="/api/integrations/trello/connect"
          >
            Conectar Trello
          </a>
        </div>
      ) : status.status === "reauthorization_required" ? (
        <div className="aa-empty">
          <p>A autorização do Trello precisa ser refeita.</p>
          <a
            className="aa-button aa-button-primary"
            href="/api/integrations/trello/connect"
          >
            Reconectar Trello
          </a>
        </div>
      ) : (
        <>
          <p className="aa-state-copy">
            <CheckCircle2 size={18} aria-hidden="true" /> Conectado
            {status.user?.fullName ? ` · ${status.user.fullName}` : ""}
            {status.user?.username ? ` · @${status.user.username}` : ""}
          </p>

          <form
            onSubmit={createBoard}
            className="aa-planning-form"
            style={{ marginTop: "var(--aa-spacing-lg)" }}
          >
            <div className="aa-surface-header">
              <div>
                <p className="aa-eyebrow">Ação rápida</p>
                <h3>Criar board</h3>
              </div>
            </div>
            <div className="aa-planning-form-row">
              <div className="aa-field">
                <label htmlFor="trello-board-name">Nome do board</label>
                <input
                  id="trello-board-name"
                  className="aa-input"
                  value={boardName}
                  onChange={(event) => setBoardName(event.target.value)}
                  disabled={creating}
                  placeholder="Ex.: Academia Arcana · QA"
                />
              </div>
              <button
                className="aa-button aa-button-primary"
                type="submit"
                disabled={creating || !boardName.trim()}
              >
                <Plus size={16} aria-hidden="true" />
                Criar
              </button>
            </div>
          </form>

          <div style={{ marginTop: "var(--aa-spacing-lg)" }}>
            <div className="aa-surface-header">
              <div>
                <p className="aa-eyebrow">Boards</p>
                <h3>Seu espaço operacional</h3>
              </div>
              <span className="aa-badge aa-badge-neutral">{boards.length}</span>
            </div>

            {boards.length ? (
              <div className="aa-field">
                <label htmlFor="trello-board-select">Board ativo</label>
                <select
                  id="trello-board-select"
                  className="aa-input"
                  value={selectedBoardId}
                  onChange={(event) => setSelectedBoardId(event.target.value)}
                >
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="aa-empty">
                <p>Nenhum board ativo encontrado.</p>
              </div>
            )}
          </div>

          {boardData ? (
            <div
              className="aa-card aa-card-default"
              style={{ marginTop: "var(--aa-spacing-lg)" }}
            >
              <div className="aa-surface-header">
                <div>
                  <p className="aa-eyebrow">Board selecionado</p>
                  <h3>{boardData.board.name}</h3>
                  {boardData.board.desc ? (
                    <p className="aa-state-copy">{boardData.board.desc}</p>
                  ) : null}
                </div>
                <a
                  className="aa-button aa-button-secondary aa-button-sm"
                  href={boardData.board.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir board ${boardData.board.name} no Trello`}
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  Abrir
                </a>
              </div>

              <div style={{ display: "grid", gap: "var(--aa-spacing-md)" }}>
                {boardData.lists.map((list) => (
                  <article className="aa-card aa-card-default" key={list.id}>
                    <div className="aa-surface-header">
                      <div>
                        <h4 style={{ margin: 0 }}>{list.name}</h4>
                        <small>
                          {cardsByList.get(list.id)?.length ?? 0} cards ativos
                        </small>
                      </div>
                    </div>

                    {cardsByList.get(list.id)?.length ? (
                      <ul className="aa-list">
                        {cardsByList.get(list.id)?.map((card) => (
                          <li className="aa-list-item" key={card.id}>
                            <div>
                              <strong>{card.name}</strong>
                              {card.due ? (
                                <small>
                                  Prazo: {new Date(card.due).toLocaleString()}
                                </small>
                              ) : null}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.5rem",
                              }}
                            >
                              <button
                                className="aa-button aa-button-secondary aa-button-sm"
                                type="button"
                                onClick={() => void completeCard(card.id)}
                                disabled={busy}
                              >
                                <CheckCircle2 size={16} aria-hidden="true" />
                                Concluir
                              </button>
                              <a
                                className="aa-button aa-button-secondary aa-button-sm"
                                href={card.url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Abrir card ${card.name} no Trello`}
                              >
                                <ExternalLink size={16} aria-hidden="true" />
                                Abrir
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="aa-state-copy">
                        Nenhum card ativo nesta lista.
                      </p>
                    )}
                  </article>
                ))}
              </div>

              <form
                onSubmit={createList}
                className="aa-planning-form"
                style={{ marginTop: "var(--aa-spacing-lg)" }}
              >
                <div className="aa-planning-form-row">
                  <div className="aa-field">
                    <label htmlFor="trello-list-name">Nova lista</label>
                    <input
                      id="trello-list-name"
                      className="aa-input"
                      value={listName}
                      onChange={(event) => setListName(event.target.value)}
                      disabled={creating}
                      placeholder="Ex.: Em revisão"
                    />
                  </div>
                  <button
                    className="aa-button aa-button-secondary"
                    type="submit"
                    disabled={creating || !listName.trim()}
                  >
                    <ListPlus size={16} aria-hidden="true" />
                    Criar lista
                  </button>
                </div>
              </form>

              {boardData.lists.length ? (
                <form
                  onSubmit={createCard}
                  className="aa-planning-form"
                  style={{ marginTop: "var(--aa-spacing-lg)" }}
                >
                  <div className="aa-planning-form-row">
                    <div className="aa-field">
                      <label htmlFor="trello-card-list">Lista</label>
                      <select
                        id="trello-card-list"
                        className="aa-input"
                        value={cardListId}
                        onChange={(event) => setCardListId(event.target.value)}
                        disabled={creating}
                      >
                        {boardData.lists.map((list) => (
                          <option key={list.id} value={list.id}>
                            {list.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="aa-field">
                      <label htmlFor="trello-card-name">Novo card</label>
                      <input
                        id="trello-card-name"
                        className="aa-input"
                        value={cardName}
                        onChange={(event) => setCardName(event.target.value)}
                        disabled={creating}
                        placeholder="Ex.: Validar acessibilidade"
                      />
                    </div>
                    <button
                      className="aa-button aa-button-primary"
                      type="submit"
                      disabled={creating || !cardName.trim()}
                    >
                      <Plus size={16} aria-hidden="true" />
                      Criar card
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}

          <form
            onSubmit={search}
            className="aa-planning-form"
            style={{ marginTop: "var(--aa-spacing-lg)" }}
          >
            <div className="aa-planning-form-row">
              <div className="aa-field">
                <label htmlFor="trello-search-query">
                  Pesquisar no Trello
                </label>
                <input
                  id="trello-search-query"
                  className="aa-input"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ex.: acessibilidade"
                />
              </div>
              <button
                className="aa-button aa-button-secondary"
                type="submit"
                disabled={busy || !query.trim()}
              >
                <Search size={16} aria-hidden="true" />
                Pesquisar
              </button>
            </div>
          </form>

          {searchResults ? (
            <div
              style={{
                display: "grid",
                gap: "var(--aa-spacing-sm)",
                marginTop: "var(--aa-spacing-lg)",
              }}
            >
              {(searchResults.boards ?? []).map((board) => (
                <a
                  className="aa-card aa-card-default"
                  href={board.url}
                  target="_blank"
                  rel="noreferrer"
                  key={`board-${board.id}`}
                >
                  <strong>{board.name}</strong>
                  <small>Board</small>
                </a>
              ))}
              {(searchResults.cards ?? []).map((card) => (
                <a
                  className="aa-card aa-card-default"
                  href={card.url}
                  target="_blank"
                  rel="noreferrer"
                  key={`card-${card.id}`}
                >
                  <strong>{card.name}</strong>
                  <small>Card</small>
                </a>
              ))}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginTop: "var(--aa-spacing-lg)",
            }}
          >
            <a
              className="aa-button aa-button-secondary"
              href="https://trello.com/"
              target="_blank"
              rel="noreferrer"
            >
              Abrir Trello
            </a>
            <button
              type="button"
              className="aa-button aa-button-secondary"
              onClick={() => void disconnect()}
              disabled={busy}
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
