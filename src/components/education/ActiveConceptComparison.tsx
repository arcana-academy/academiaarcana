"use client";

import { useState } from "react";
import type { ConceptComparisonExcerpt } from "@/application/education/concept-comparison";

type ReflectionField = "common" | "different" | "example";
const prompts: ReadonlyArray<{ key: ReflectionField; label: string; hint: string }> = [
  { key: "common", label: "O que os dois conteúdos têm em comum?", hint: "Explique uma relação que você reconhece." },
  { key: "different", label: "Em que os conceitos diferem?", hint: "Identifique pelo menos uma diferença relevante." },
  { key: "example", label: "Como você aplicaria os dois em um exemplo?", hint: "Crie um exemplo com suas próprias palavras." },
];

/** Temporary metacognitive comparison; no mutation, analytics or submission. */
export function ActiveConceptComparison({
  pages,
}: { pages: [ConceptComparisonExcerpt, ConceptComparisonExcerpt] }) {
  const [notes, setNotes] = useState<Record<ReflectionField, string>>({
    common: "", different: "", example: "",
  });
  return (
    <section className="aa-stack" aria-labelledby="comparison-work-title">
      <h2 id="comparison-work-title">Leitura comparativa</h2>
      <p className="aa-state-copy">
        Leia os trechos que você salvou e elabore suas próprias relações.
        A comparação não usa inteligência artificial e não atribui notas, XP ou progresso.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {pages.map((page, index) => (
          <article className="aa-surface aa-sanctuary-section" key={page.id} aria-label={"Conteúdo " + (index + 1) + ": " + page.title}>
            <h3>{page.title}</h3>
            {page.blocks.length ? (
              <ol className="aa-list" aria-label={"Trechos salvos de " + page.title}>
                {page.blocks.map((block, position) => (
                  <li className="aa-list-item" key={position}><p className="whitespace-pre-wrap break-words">{block}</p></li>
                ))}
              </ol>
            ) : (
              <p className="aa-state-copy">Esta página ainda não tem blocos textuais preenchidos.</p>
            )}
            {page.truncated ? (
              <p className="aa-state-copy">Exibindo apenas os primeiros trechos. Consulte a página no Workspace para ler tudo.</p>
            ) : null}
            <a className="aa-button aa-button-secondary aa-button-sm"
              href={"/workspace?page=" + encodeURIComponent(page.id)} target="_blank" rel="noopener noreferrer">
              Abrir página inteira (nova aba)
            </a>
          </article>
        ))}
      </div>
      <section className="aa-surface aa-sanctuary-section" aria-labelledby="comparison-reflection-title">
        <h3 id="comparison-reflection-title">Construa a sua síntese</h3>
        <p role="status" aria-live="polite">
          Anotações temporárias: não são enviadas nem salvas. Ao sair desta tela, elas serão perdidas.
        </p>
        {prompts.map((prompt) => (
          <div key={prompt.key} className="aa-form">
            <label htmlFor={"comparison-" + prompt.key}>{prompt.label}</label>
            <p className="aa-state-copy" id={"comparison-hint-" + prompt.key}>{prompt.hint}</p>
            <textarea
              id={"comparison-" + prompt.key}
              aria-describedby={"comparison-hint-" + prompt.key}
              maxLength={1500}
              rows={3}
              value={notes[prompt.key]}
              onChange={(event) => setNotes((current) => ({ ...current, [prompt.key]: event.target.value }))}
            />
          </div>
        ))}
        <button className="aa-button aa-button-secondary" type="button"
          onClick={() => setNotes({ common: "", different: "", example: "" })}>
          Limpar anotações sem salvar
        </button>
      </section>
    </section>
  );
}
