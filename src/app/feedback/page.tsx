"use client";

import { FormEvent, useState } from "react";
import { MessageSquareText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, feedback }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Não foi possível salvar o feedback.");
        return;
      }

      setName("");
      setEmail("");
      setFeedback("");
      setStatus("Feedback enviado com sucesso.");
    } catch {
      setError("Não foi possível conectar ao serviço de feedback.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--aa-color-background)] px-4 py-10 text-[var(--aa-color-foreground)] sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <section className="rounded-3xl border border-[var(--aa-color-border)] bg-[var(--aa-color-surface)] p-6 shadow-xl sm:p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--aa-color-primary)]">
                Feedback Hub
              </p>
              <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Uma escuta que vira direção.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-[var(--aa-color-muted-foreground)]">
                Conte o que está funcionando, o que está difícil e onde a Academia
                Arcana pode evoluir.
              </p>
            </div>
            <Sparkles aria-hidden="true" className="mt-1 shrink-0 text-[var(--aa-color-primary)]" />
          </div>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <Input
              name="name"
              label="Nome"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome (opcional)"
              autoComplete="name"
              maxLength={120}
            />
            <Input
              name="email"
              label="E-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@exemplo.com"
              type="email"
              autoComplete="email"
              required
            />

            <div className="aa-field">
              <label htmlFor="feedback-message">Feedback</label>
              <textarea
                id="feedback-message"
                name="feedback"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Escreva sua resposta..."
                rows={8}
                minLength={1}
                maxLength={2000}
                required
                className="aa-input min-h-44 resize-y"
              />
              <p className="aa-field-description">Até 2.000 caracteres.</p>
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--aa-color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div aria-live="polite" className="min-h-5 text-sm">
                {error ? <p role="alert" className="text-[var(--aa-color-danger)]">{error}</p> : null}
                {status ? <p className="text-[var(--aa-color-success)]">{status}</p> : null}
              </div>
              <Button type="submit" size="lg" loading={loading} disabled={loading}>
                <MessageSquareText aria-hidden="true" size={18} />
                Enviar feedback
              </Button>
            </div>
          </form>
        </section>

        <aside className="rounded-3xl border border-[var(--aa-color-border)] bg-[var(--aa-color-surface)]/80 p-6 sm:p-8" aria-labelledby="feedback-context">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--aa-color-muted-foreground)]">
            Contexto
          </p>
          <h2 id="feedback-context" className="mt-3 text-2xl font-semibold">
            Cada resposta chega com intenção.
          </h2>
          <div className="mt-6 space-y-3 text-sm leading-6 text-[var(--aa-color-muted-foreground)]">
            <p>O nome é opcional; e-mail e mensagem são validados antes do armazenamento.</p>
            <p>As respostas ficam vinculadas ao usuário autenticado e protegidas pelo RLS do Supabase.</p>
            <p>O envio não expõe chaves privilegiadas no navegador.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}