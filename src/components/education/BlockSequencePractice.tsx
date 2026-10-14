"use client";

import { useState } from "react";
import type { ConceptComparisonExcerpt } from "@/application/education/concept-comparison";
import {
  buildBlockSequence, moveSequenceStep, scoreSequence,
} from "@/application/education/block-sequencing";

/**
 * The passage order is local UI state only. No submissions, analytics, marks,
 * study tasks, XP, or persisted educational evidence can be produced here.
 */
export function BlockSequencePractice({ page }: { page: ConceptComparisonExcerpt }) {
  const exercise = buildBlockSequence(page);
  const [order, setOrder] = useState<number[]>(() =>
    exercise ? exercise.steps.map((step) => step.id).reverse() : [],
  );
  const [verified, setVerified] = useState(false);

  if (!exercise) {
    return (
      <section className="aa-surface aa-sanctuary-section" role="status">
        <h2>Esta página ainda não tem trechos suficientes</h2>
        <p>Salve pelo menos dois blocos de texto diferentes no Workspace para praticar a sequência.</p>
      </section>
    );
  }

  const score = scoreSequence(order, exercise.steps.length);
  function move(index: number, direction: -1 | 1) {
    setOrder((current) => moveSequenceStep(current, index, direction));
    setVerified(false);
  }

  return (
    <section className="aa-surface aa-sanctuary-section" aria-labelledby="sequence-exercise-title">
      <h2 id="sequence-exercise-title">Reconstrua a sequência · {exercise.title}</h2>
      <p>Os trechos foram apresentados em ordem inversa. Use os botões para recuperar a ordem em que você os salvou.</p>
      <p className="aa-state-copy">
        Exercício temporário: nenhuma resposta é enviada ou salva e nenhuma missão, nota ou XP é gerada.
      </p>
      <ol className="aa-list" aria-label="Trechos para organizar">
        {order.map((id, index) => (
          <li className="aa-list-item" key={id}>
            <div className="aa-stack">
              <strong>Posição {index + 1}</strong>
              <p className="whitespace-pre-wrap break-words">{exercise.steps[id].text}</p>
              <div className="aa-action-row">
                <button className="aa-button aa-button-secondary aa-button-sm"
                  type="button" aria-label={`Mover trecho da posição ${index + 1} para cima`}
                  disabled={index === 0} onClick={() => move(index, -1)}>Mover para cima</button>
                <button className="aa-button aa-button-secondary aa-button-sm"
                  type="button" aria-label={`Mover trecho da posição ${index + 1} para baixo`}
                  disabled={index === order.length - 1} onClick={() => move(index, 1)}>Mover para baixo</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="aa-action-row">
        <button type="button" className="aa-button aa-button-primary" onClick={() => setVerified(true)}>
          Conferir sequência
        </button>
        <button type="button" className="aa-button aa-button-secondary"
          onClick={() => {
            setOrder(exercise.steps.map((step) => step.id).reverse());
            setVerified(false);
          }}>Recomeçar sem salvar</button>
      </div>
      <p role="status" aria-live="polite" className="aa-state-copy">
        {verified
          ? score === order.length
            ? "Sequência reconstruída corretamente. Esta conferência não altera seu progresso."
            : `${score} de ${order.length} trechos na posição original. Tente novamente no seu ritmo.`
          : "Organize os trechos e confira quando desejar."}
      </p>
      {exercise.truncated ? (
        <p className="aa-state-copy">Somente os primeiros blocos elegíveis foram usados. Consulte o texto completo no Workspace.</p>
      ) : null}
      <a className="aa-button aa-button-secondary aa-button-sm"
        href={"/workspace?page=" + encodeURIComponent(exercise.pageId)}
        target="_blank" rel="noopener noreferrer">Abrir página inteira (nova aba)</a>
    </section>
  );
}
