"use client";

import { useState } from "react";

type Entry = { id: number; term: string; definition: string };

export function TemporaryStudyGlossary({ title, onClose }: { title: string; onClose: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [nextId, setNextId] = useState(1);

  const add = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!term.trim() || !definition.trim()) return;
    setEntries((current) => [...current, { id: nextId, term: term.trim(), definition: definition.trim() }]);
    setNextId((current) => current + 1);
    setTerm("");
    setDefinition("");
  };

  return (
    <section className="aa-surface aa-sanctuary-section" aria-labelledby="temporary-glossary-title">
      <h2 id="temporary-glossary-title">Glossário pessoal temporário</h2>
      <p>Organize conceitos de &quot;{title}&quot; com suas palavras. Nada será salvo ou usado para gerar XP, tentativas ou conclusão.</p>
      <form onSubmit={add}>
        <label htmlFor="temporary-glossary-term">Termo</label>
        <input id="temporary-glossary-term" value={term} onChange={(event) => setTerm(event.target.value)} maxLength={120} />
        <label htmlFor="temporary-glossary-definition">Definição com suas palavras</label>
        <textarea id="temporary-glossary-definition" value={definition} onChange={(event) => setDefinition(event.target.value)} maxLength={2000} />
        <button type="submit" disabled={!term.trim() || !definition.trim()}>Adicionar conceito</button>
      </form>
      <p role="status" aria-live="polite">{entries.length} conceito(s) nesta tela.</p>
      {entries.length === 0 ? <p>Nenhum conceito adicionado ainda.</p> : (
        <ul className="aa-list">
          {entries.map((entry) => (
            <li key={entry.id}>
              <label htmlFor={`glossary-term-${entry.id}`}>Termo {entry.id}</label>
              <input id={`glossary-term-${entry.id}`} value={entry.term} maxLength={120} onChange={(event) => setEntries((current) => current.map((item) => item.id === entry.id ? { ...item, term: event.target.value } : item))} />
              <label htmlFor={`glossary-definition-${entry.id}`}>Definição {entry.id}</label>
              <textarea id={`glossary-definition-${entry.id}`} value={entry.definition} maxLength={2000} onChange={(event) => setEntries((current) => current.map((item) => item.id === entry.id ? { ...item, definition: event.target.value } : item))} />
              <button type="button" onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))}>Remover conceito {entry.id}</button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="aa-button aa-button-ghost" onClick={onClose}>Voltar ao editor</button>
    </section>
  );
}
