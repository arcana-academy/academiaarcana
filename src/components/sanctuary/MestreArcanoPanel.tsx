"use client";

import Image from "next/image";
import { useState } from "react";
import type { FormEvent } from "react";

type AgentResponse = {
  output?: unknown;
  error?: unknown;
};

const STARTER_PROMPTS = [
  "O que devo estudar agora?",
  "Monte meu próximo passo de estudo.",
  "Explique como retomar meu estudo sem me sobrecarregar.",
] as const;

const arcaneCore = "/assets/intelligence/aa-arcane-core.svg";

/** Render the authenticated Mestre Arcano interaction panel. */
export function MestreArcanoPanel() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /** Submit the learner request to the authenticated Mestre Arcano endpoint. */
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = input.trim();
    if (!normalized || pending) return;

    setPending(true);
    setError(null);
    setOutput(null);

    try {
      const response = await fetch("/api/agent/mestre-arcano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: normalized }),
      });

      const payload = (await response.json()) as AgentResponse;
      if (!response.ok || typeof payload.output !== "string") {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Não foi possível consultar o Mestre Arcano.",
        );
      }

      setOutput(payload.output);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível consultar o Mestre Arcano.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="aa-surface aa-mestre-panel" aria-labelledby="mestre-arcano-title">
      <div className="aa-mestre-header">
        <div className="aa-mestre-core" aria-hidden="true">
          <Image src={arcaneCore} alt="" width={72} height={72} priority />
        </div>
        <div className="aa-surface-header aa-mestre-header-copy">
          <div>
            <p className="aa-eyebrow">Inteligência · Mestre Arcano</p>
            <h2 id="mestre-arcano-title">Seu próximo passo pode começar aqui.</h2>
            <p>Consulte o tutor usando apenas o contexto autorizado da sua conta.</p>
          </div>
        </div>
      </div>

      <div className="aa-mestre-prompts" aria-label="Sugestões de perguntas">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            className="aa-mestre-prompt"
            key={prompt}
            type="button"
            onClick={() => setInput(prompt)}
            disabled={pending}
          >
            {prompt}
          </button>
        ))}
      </div>

      <form className="aa-mestre-form" onSubmit={submit}>
        <label className="aa-visually-hidden" htmlFor="mestre-arcano-input">
          Mensagem para o Mestre Arcano
        </label>
        <textarea
          id="mestre-arcano-input"
          className="aa-input aa-mestre-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Pergunte sobre seu estudo, planejamento ou próximo passo..."
          rows={3}
          maxLength={8000}
          disabled={pending}
        />
        <button
          className="aa-button aa-button-primary"
          type="submit"
          disabled={pending || !input.trim()}
        >
          {pending ? "Consultando..." : "Consultar Mestre Arcano"}
        </button>
      </form>

      {error ? (
        <div className="aa-empty aa-mestre-feedback" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {output ? (
        <div className="aa-mestre-response" aria-live="polite">
          <p className="aa-eyebrow">Resposta</p>
          <div>{output}</div>
        </div>
      ) : null}
    </section>
  );
}
