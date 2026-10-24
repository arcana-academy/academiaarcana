"use client";

import { useState } from "react";
import type { PageContent } from "@/domains/learning";

type Props = {
  title: string;
  blocks: PageContent["blocks"];
  onClose: () => void;
};

/** Temporary, user-controlled checklist of saved authored content; no education evidence is written. */
export function SavedBlockStudyChecklist({ title, blocks, onClose }: Props) {
  const items = blocks.map((block) => block.content.trim()).filter(Boolean);
  const [checked, setChecked] = useState<number[]>([]);
  const completed = checked.length;

  return (
    <section className="aa-surface aa-sanctuary-section" aria-labelledby="block-checklist-title">
      <h2 id="block-checklist-title">Lista de estudo por trechos</h2>
      <p>Organize a leitura de &quot;{title}&quot; no seu ritmo. As marcações duram apenas enquanto esta tela estiver aberta; não são tentativas, conclusão registrada nem XP.</p>
      {items.length === 0 ? (
        <p>Esta página não possui trechos salvos para organizar.</p>
      ) : (
        <>
          <p role="status" aria-live="polite">{completed} de {items.length} trechos marcados nesta tela.</p>
          <ul className="aa-list">
            {items.map((item, index) => (
              <li key={index}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked.includes(index)}
                    onChange={(event) =>
                      setChecked((current) =>
                        event.target.checked
                          ? [...current.filter((value) => value !== index), index]
                          : current.filter((value) => value !== index),
                      )
                    }
                  />
                  <span>Trecho {index + 1}</span>
                </label>
                <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item}</p>
              </li>
            ))}
          </ul>
          {completed === items.length ? (
            <p role="status">Todos os trechos foram marcados nesta tela. Nenhum progresso foi salvo.</p>
          ) : null}
          <button type="button" className="aa-button aa-button-secondary" onClick={() => setChecked([])}>
            Limpar marcações
          </button>
        </>
      )}
      <button type="button" className="aa-button aa-button-ghost" onClick={onClose}>
        Voltar ao editor
      </button>
    </section>
  );
}
