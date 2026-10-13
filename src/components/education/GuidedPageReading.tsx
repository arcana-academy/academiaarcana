"use client";

import { useState } from "react";

import type { PageContent } from "@/domains/learning";
import { Progress } from "@/components/ui/progress";

type GuidedPageReadingProps = {
  title: string;
  blocks: PageContent["blocks"];
  onClose: () => void;
};

/**
 * Focused view of already-saved authored blocks. Position is temporary and
 * never records educational evidence, stored progress, rewards or missions.
 */
export function GuidedPageReading({ title, blocks, onClose }: GuidedPageReadingProps) {
  const [position, setPosition] = useState(0);
  const [finished, setFinished] = useState(false);
  const passages = blocks.map((block) => block.content.trim()).filter(Boolean);

  if (!passages.length) {
    return (
      <section className="aa-surface aa-sanctuary-section" aria-labelledby="guided-reading-title">
        <h2 id="guided-reading-title">Modo de leitura guiada</h2>
        <p>Esta página ainda não tem trechos de conteúdo para ler.</p>
        <button type="button" className="aa-button aa-button-secondary" onClick={onClose}>
          Voltar ao editor
        </button>
      </section>
    );
  }

  const lastPosition = passages.length - 1;

  return (
    <section className="aa-surface aa-sanctuary-section" aria-labelledby="guided-reading-title">
      <header>
        <p className="aa-eyebrow">Workspace · leitura focada</p>
        <h2 id="guided-reading-title">Modo de leitura guiada</h2>
        <p className="aa-state-copy">
          Você está lendo os blocos salvos de &quot;{title}&quot;, um de cada vez.
          O percurso é temporário: não registra conclusão da página, tentativas, missões ou XP.
        </p>
      </header>

      <p role="status" aria-live="polite">
        Trecho {position + 1} de {passages.length}
      </p>
      <Progress
        value={Math.round(((position + 1) / passages.length) * 100)}
        label="Percurso de leitura nesta tela, sem progresso registrado"
      />

      <article className="aa-card aa-card-default" aria-labelledby="guided-reading-passage-title">
        <h3 id="guided-reading-passage-title">Conteúdo do trecho {position + 1}</h3>
        <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{passages[position]}</p>
        <p className="aa-state-copy">
          Que ideia central você consegue explicar com suas próprias palavras?
        </p>
      </article>

      {finished ? (
        <div role="status" aria-live="polite">
          <p>Você percorreu os trechos nesta tela. Nada foi salvo no histórico de estudo.</p>
          <button
            type="button"
            className="aa-button aa-button-secondary"
            onClick={() => {
              setPosition(0);
              setFinished(false);
            }}
          >
            Recomeçar leitura
          </button>
        </div>
      ) : (
        <div className="aa-action-row">
          <button
            type="button"
            className="aa-button aa-button-secondary"
            disabled={position === 0}
            onClick={() => setPosition((current) => Math.max(0, current - 1))}
          >
            Trecho anterior
          </button>
          {position < lastPosition ? (
            <button
              type="button"
              className="aa-button aa-button-primary"
              onClick={() => setPosition((current) => Math.min(lastPosition, current + 1))}
            >
              Próximo trecho
            </button>
          ) : (
            <button
              type="button"
              className="aa-button aa-button-primary"
              onClick={() => setFinished(true)}
            >
              Encerrar leitura nesta tela
            </button>
          )}
        </div>
      )}

      <button type="button" className="aa-button aa-button-ghost" onClick={onClose}>
        Voltar ao editor
      </button>
    </section>
  );
}
