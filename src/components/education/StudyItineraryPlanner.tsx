"use client";

import { useState } from "react";

import type { StudyItineraryPage } from "@/application/education/study-itinerary";

const MAX_SELECTED = 5;

/** Local-only route builder; no writes, duration claims or reward events. */
export function StudyItineraryPlanner({ pages }: { pages: StudyItineraryPage[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const chosen = selected.flatMap((id) => {
    const page = pages.find((candidate) => candidate.id === id);
    return page ? [page] : [];
  });

  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      if (!checked) return current.filter((candidate) => candidate !== id);
      if (current.includes(id) || current.length >= MAX_SELECTED || !pages.some((page) => page.id === id)) {
        return current;
      }
      return [...current, id];
    });
  }

  function move(index: number, offset: number) {
    setSelected((current) => {
      const destination = index + offset;
      if (index < 0 || destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination]!, next[index]!];
      return next;
    });
  }

  return (
    <>
      <section className="aa-surface aa-sanctuary-section" aria-labelledby="itinerary-choose-title">
        <h2 id="itinerary-choose-title">Escolha páginas salvas</h2>
        <p>
          Selecione até {MAX_SELECTED} páginas. O roteiro existe apenas nesta tela
          e não cria tarefas, tentativas, notas, XP ou progresso registrado.
        </p>
        <p role="status" aria-live="polite">
          {chosen.length} de {MAX_SELECTED} páginas selecionadas.
        </p>
        <fieldset className="aa-stack">
          <legend>Páginas disponíveis para o seu roteiro</legend>
          {pages.map((page) => (
            <label key={page.id} className="aa-card aa-card-default">
              <input
                type="checkbox"
                checked={selected.includes(page.id)}
                disabled={!selected.includes(page.id) && selected.length >= MAX_SELECTED}
                onChange={(event) => toggle(page.id, event.currentTarget.checked)}
              />
              {" "}{page.title} — {page.practiceCount} atividade(s) de prática
            </label>
          ))}
        </fieldset>
      </section>

      <section className="aa-surface aa-sanctuary-section" aria-labelledby="itinerary-plan-title">
        <h2 id="itinerary-plan-title">Seu roteiro temporário</h2>
        {chosen.length === 0 ? (
          <p className="aa-state-copy">Selecione uma página acima para começar.</p>
        ) : (
          <ol className="aa-list" aria-label="Ordem de estudo escolhida">
            {chosen.map((page, index) => (
              <li key={page.id} className="aa-list-item aa-surface">
                <div className="aa-stack">
                  <h3>{index + 1}. {page.title}</h3>
                  <p className="aa-state-copy">
                    1. Leia a página salva. 2. Tente recuperar as ideias sem consultar.
                    {page.practiceCount > 0
                      ? " 3. Faça uma atividade existente na Prática."
                      : " Ainda não há uma atividade de prática nesta página."}
                  </p>
                  <div className="aa-action-row">
                    <a className="aa-button aa-button-secondary aa-button-sm" href={page.workspaceHref} target="_blank" rel="noopener noreferrer">
                      Abrir página (nova aba)
                    </a>
                    <a className="aa-button aa-button-secondary aa-button-sm" href={page.practiceHref} target="_blank" rel="noopener noreferrer">
                      {page.practiceCount ? "Abrir Prática (nova aba)" : "Criar atividade na Prática (nova aba)"}
                    </a>
                  </div>
                  <div className="aa-action-row">
                    <button type="button" className="aa-button aa-button-ghost" disabled={index === 0}
                      onClick={() => move(index, -1)} aria-label={`Mover ${page.title} para cima`}>Mover para cima</button>
                    <button type="button" className="aa-button aa-button-ghost" disabled={index === chosen.length - 1}
                      onClick={() => move(index, 1)} aria-label={`Mover ${page.title} para baixo`}>Mover para baixo</button>
                    <button type="button" className="aa-button aa-button-ghost"
                      onClick={() => toggle(page.id, false)} aria-label={`Remover ${page.title} do roteiro`}>Remover</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
        {chosen.length > 0 ? (
          <button className="aa-button aa-button-secondary" type="button" onClick={() => setSelected([])}>
            Limpar roteiro sem salvar
          </button>
        ) : null}
      </section>
    </>
  );
}
