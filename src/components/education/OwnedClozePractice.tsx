"use client";

import { useState } from "react";
import { buildClozeParts } from "@/application/education/cloze-practice";
import type { ConceptComparisonExcerpt } from "@/application/education/concept-comparison";

/**
 * No submission, grading or persistence: reveals exact words from saved text
 * for self-directed retrieval only.
 */
export function OwnedClozePractice({ page }: { page: ConceptComparisonExcerpt }) {
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState<number[]>([]);

  if (page.blocks.length === 0) {
    return (
      <section className="aa-surface aa-sanctuary-section" role="status">
        <h2>Esta página ainda não tem texto para criar lacunas</h2>
        <p>Adicione blocos textuais no Workspace e salve sua página antes de praticar.</p>
      </section>
    );
  }

  const block = page.blocks[position] ?? "";
  const parts = buildClozeParts(block);
  const count = parts.filter((part) => part.kind === "gap").length;

  function goTo(index: number) {
    if (index < 0 || index >= page.blocks.length) return;
    setPosition(index);
    setRevealed([]);
  }

  function toggleGap(number: number) {
    setRevealed((current) =>
      current.includes(number)
        ? current.filter((item) => item !== number)
        : [...current, number],
    );
  }

  return (
    <section className="aa-surface aa-sanctuary-section" aria-labelledby="cloze-title">
      <h2 id="cloze-title">Recuperação por lacunas · {page.title}</h2>
      <p>
        Recorde as palavras ocultadas nos seus próprios textos. As lacunas são selecionadas
        automaticamente; elas não são uma avaliação de domínio ou aprendizado confirmado.
      </p>
      <p className="aa-state-copy">
        Nada é salvo: não há envio de respostas, pontuação, XP, missões ou histórico.
      </p>
      <p role="status" aria-live="polite">Trecho {position + 1} de {page.blocks.length}</p>

      {count === 0 ? (
        <p className="aa-state-copy">Este trecho não contém palavras longas suficientes para ocultar.</p>
      ) : (
        <p className="aa-state-copy">
          {count} lacuna(s). Ative cada botão para revelar a palavra original e ocultá-la novamente.
        </p>
      )}
      <div className="aa-card aa-card-default whitespace-pre-wrap break-words" aria-label="Texto salvo com lacunas">
        {parts.map((part, index) =>
          part.kind === "text" ? (
            <span key={index}>{part.text}</span>
          ) : (
            <button
              type="button"
              key={index}
              className="aa-button aa-button-ghost aa-button-sm"
              aria-pressed={revealed.includes(part.number)}
              aria-label={(revealed.includes(part.number) ? "Ocultar" : "Revelar") + " lacuna " + part.number}
              onClick={() => toggleGap(part.number)}
            >
              {revealed.includes(part.number) ? part.answer : "[Lacuna " + part.number + "]"}
            </button>
          ),
        )}
      </div>
      <div className="aa-action-row">
        <button type="button" className="aa-button aa-button-secondary" disabled={position === 0}
          onClick={() => goTo(position - 1)}>Trecho anterior</button>
        <button type="button" className="aa-button aa-button-primary" disabled={position === page.blocks.length - 1}
          onClick={() => goTo(position + 1)}>Próximo trecho</button>
        <button type="button" className="aa-button aa-button-ghost" disabled={revealed.length === 0}
          onClick={() => setRevealed([])}>Ocultar respostas novamente</button>
      </div>
      {page.truncated ? (
        <p className="aa-state-copy">
          Somente os primeiros trechos foram carregados. Consulte a página original para o conteúdo completo.
        </p>
      ) : null}
      <a className="aa-button aa-button-secondary aa-button-sm"
        href={"/workspace?page=" + encodeURIComponent(page.id)}
        target="_blank" rel="noopener noreferrer">Abrir página inteira (nova aba)</a>
    </section>
  );
}
