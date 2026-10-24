"use client";

import { useState } from "react";

const strategies = [
  { id: "explain", title: "Explicar com suas palavras", guidance: "Após estudar um conceito, explique-o em voz alta ou escreva uma explicação sem consultar o material." },
  { id: "examples", title: "Criar exemplos", guidance: "Escolha um conceito do conteúdo e crie um exemplo próprio que demonstre onde ele se aplica." },
  { id: "connections", title: "Conectar ideias", guidance: "Identifique duas ideias estudadas e descreva como elas se relacionam ou se diferenciam." },
] as const;

export function StudyStrategies({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = strategies.find((strategy) => strategy.id === selected);

  return (
    <section className="aa-surface aa-sanctuary-section" aria-labelledby="study-strategies-heading">
      <h2 id="study-strategies-heading">Estratégias para compreender o conteúdo</h2>
      <p>Escolha uma técnica para orientar seu estudo. A seleção é temporária, não registra desempenho nem concede XP.</p>
      <fieldset>
        <legend>Escolha uma estratégia</legend>
        {strategies.map((strategy) => (
          <label key={strategy.id} style={{ display: "block" }}>
            <input
              type="radio"
              name="study-strategy"
              value={strategy.id}
              checked={selected === strategy.id}
              onChange={() => setSelected(strategy.id)}
            />
            {strategy.title}
          </label>
        ))}
      </fieldset>
      <div role="status" aria-live="polite">
        {active ? (
          <>
            <h3>{active.title}</h3>
            <p>{active.guidance}</p>
            <p>Você decide quando praticar. Nenhuma conclusão é registrada nesta tela.</p>
          </>
        ) : (
          <p>Selecione uma estratégia para ver as orientações.</p>
        )}
      </div>
      <button type="button" className="aa-button aa-button-secondary" onClick={() => setSelected(null)} disabled={!selected}>
        Limpar escolha
      </button>
      <button type="button" className="aa-button aa-button-ghost" onClick={onClose}>
        Voltar ao editor
      </button>
    </section>
  );
}
