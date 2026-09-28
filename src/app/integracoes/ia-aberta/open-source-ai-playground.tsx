"use client";

import { FormEvent, useState } from "react";

type Provider = {
  id: string;
  name: string;
  runtime: string;
  configured: boolean;
};

type Props = {
  providers: readonly Provider[];
};

export default function OpenSourceAiPlayground({ providers }: Props) {
  const runnable = providers.filter((provider) => provider.configured);
  const [provider, setProvider] = useState(runnable[0]?.id ?? "");
  const [model, setModel] = useState("");
  const [prompt, setPrompt] = useState("Explique em uma frase o que é aprendizagem ativa.");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setAnswer("");
    setError("");
    try {
      const response = await fetch("/api/ia-aberta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const payload = (await response.json()) as { content?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Falha ao consultar o runtime.");
      setAnswer(payload.content ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao consultar o runtime.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="aa-card aa-card-elevated" aria-labelledby="open-ai-playground-title" style={{ marginTop: "var(--aa-spacing-lg)", display: "grid", gap: "var(--aa-spacing-md)" }}>
      <div>
        <h2 id="open-ai-playground-title" style={{ margin: 0 }}>Laboratório de execução</h2>
        <p style={{ color: "var(--aa-text-secondary)", marginBottom: 0 }}>
          Teste diretamente um runtime configurado. As credenciais permanecem no servidor.
        </p>
      </div>

      {runnable.length === 0 ? (
        <p role="status">Nenhum runtime de inference está configurado neste ambiente. Configure Ollama, vLLM, BentoML ou Hugging Face no servidor para habilitar o teste.</p>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: "var(--aa-spacing-sm)" }}>
          <label>
            Runtime
            <select value={provider} onChange={(event) => setProvider(event.target.value)} className="aa-input" style={{ display: "block", width: "100%", marginTop: "0.35rem" }}>
              {runnable.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label>
            Modelo
            <input value={model} onChange={(event) => setModel(event.target.value)} required className="aa-input" style={{ display: "block", width: "100%", marginTop: "0.35rem" }} placeholder="ex.: llama3.2:3b" />
          </label>
          <label>
            Prompt
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} required rows={4} className="aa-input" style={{ display: "block", width: "100%", marginTop: "0.35rem", resize: "vertical" }} />
          </label>
          <button className="aa-button aa-button-primary" type="submit" disabled={loading}>
            {loading ? "Executando…" : "Executar no runtime"}
          </button>
        </form>
      )}

      {error && <p role="alert">{error}</p>}
      {answer && (
        <output aria-live="polite" className="aa-card aa-card-default">
          <strong>Resposta</strong>
          <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{answer}</p>
        </output>
      )}
    </section>
  );
}
