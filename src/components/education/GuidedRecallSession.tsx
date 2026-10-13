"use client";

import { useState } from "react";

export type GuidedRecallItem = {
  id: string;
  pageTitle: string;
  prompt: string;
  practiceHref: string;
};

type RecallRating = "remembered" | "review";

/**
 * A temporary practice aid, not a second evidence store.
 * Only /pratica can persist attempts and trigger mission/progress effects.
 */
export function GuidedRecallSession({ items }: { items: GuidedRecallItem[] }) {
  const [position, setPosition] = useState(0);
  const [ratings, setRatings] = useState<Record<string, RecallRating>>({});
  const [round, setRound] = useState(0);

  if (items.length === 0) {
    return <p>Nenhuma atividade disponível para esta sessão.</p>;
  }

  const item = items[position]!;
  const rating = ratings[item.id];
  const finished = position === items.length - 1 && Boolean(rating);
  const remembered = Object.values(ratings).filter((value) => value === "remembered").length;
  const toReview = Object.values(ratings).filter((value) => value === "review").length;

  function restart() {
    setRatings({});
    setPosition(0);
    setRound((current) => current + 1);
  }

  return (
    <section aria-labelledby="guided-recall-title" className="aa-surface aa-sanctuary-section" key={round}>
      <h2 id="guided-recall-title">Recuperação ativa guiada</h2>
      <p className="aa-state-copy">
        Pense na resposta antes de consultar o material. Esta autoavaliação é temporária:
        não registra tentativas, notas, XP, missões ou tarefas. Use a Prática para registrar uma tentativa real.
      </p>

      <p aria-live="polite" role="status">
        Atividade {position + 1} de {items.length}
      </p>
      <article className="aa-card aa-card-default" aria-labelledby="guided-recall-prompt">
        <p className="aa-eyebrow">{item.pageTitle}</p>
        <h3 id="guided-recall-prompt">{item.prompt}</h3>
        <p>Formule sua resposta de memória, sem consultar a referência.</p>
        <fieldset className="aa-stack">
          <legend>Como foi sua lembrança nesta sessão?</legend>
          <label>
            <input
              type="radio"
              name={`recall-${round}-${position}`}
              checked={rating === "remembered"}
              onChange={() => setRatings((current) => ({ ...current, [item.id]: "remembered" }))}
            />
            Consegui recordar os pontos principais
          </label>
          <label>
            <input
              type="radio"
              name={`recall-${round}-${position}`}
              checked={rating === "review"}
              onChange={() => setRatings((current) => ({ ...current, [item.id]: "review" }))}
            />
            Preciso revisar e tentar novamente
          </label>
        </fieldset>
        <p className="aa-state-copy" aria-live="polite">
          {rating
            ? "Sua escolha vale somente nesta tela; não foi registrada no histórico."
            : "Escolha uma autoavaliação para continuar."}
        </p>
        <div className="aa-action-row">
          <a className="aa-button aa-button-secondary" href={item.practiceHref}>
            Abrir Prática para registrar tentativa
          </a>
          {position > 0 ? (
            <button className="aa-button aa-button-ghost" type="button" onClick={() => setPosition((current) => current - 1)}>
              Anterior
            </button>
          ) : null}
          {position < items.length - 1 ? (
            <button
              className="aa-button aa-button-primary"
              type="button"
              disabled={!rating}
              onClick={() => setPosition((current) => current + 1)}
            >
              Próxima pergunta
            </button>
          ) : null}
        </div>
      </article>
      {finished ? (
        <section role="status" aria-labelledby="guided-recall-finish">
          <h3 id="guided-recall-finish">Sessão de reflexão concluída</h3>
          <p>
            Nesta tela: {remembered} lembrança(s) satisfatória(s) e {toReview} item(ns) para revisar.
            Esses números não representam progresso registrado.
          </p>
          <button type="button" className="aa-button aa-button-secondary" onClick={restart}>
            Recomeçar sem salvar
          </button>
        </section>
      ) : null}
    </section>
  );
}
