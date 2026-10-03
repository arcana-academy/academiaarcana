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
    <main className="aa-public-page aa-feedback-page">
      <div className="aa-feedback-grid">
        <section className="aa-card aa-card-elevated aa-feedback-card">
          <div className="aa-feedback-header">
            <div>
              <p className="aa-eyebrow">
                Feedback Hub
              </p>
              <h1 className="aa-feedback-title">
                Uma escuta que vira direção.
              </h1>
              <p className="aa-feedback-lede">
                Conte o que está funcionando, o que está difícil e onde a Academia
                Arcana pode evoluir.
              </p>
            </div>
            <Sparkles aria-hidden="true" className="aa-feedback-mark" />
          </div>

          <form onSubmit={onSubmit} className="aa-feedback-form" noValidate>
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
                className="aa-input aa-feedback-textarea"
              />
              <p className="aa-field-description">Até 2.000 caracteres.</p>
            </div>

            <div className="aa-feedback-form-footer">
              <div aria-live="polite" className="aa-feedback-status">
                {error ? <p role="alert" className="aa-feedback-status-error">{error}</p> : null}
                {status ? <p className="aa-feedback-status-success">{status}</p> : null}
              </div>
              <Button type="submit" size="lg" loading={loading} disabled={loading}>
                <MessageSquareText aria-hidden="true" size={18} />
                Enviar feedback
              </Button>
            </div>
          </form>
        </section>

        <aside className="aa-card aa-card-default aa-feedback-aside" aria-labelledby="feedback-context">
          <p className="aa-eyebrow aa-feedback-aside-eyebrow">
            Contexto
          </p>
          <h2 id="feedback-context" className="aa-feedback-aside-title">
            Cada resposta chega com intenção.
          </h2>
          <div className="aa-feedback-aside-copy">
            <p>O nome é opcional; e-mail e mensagem são validados antes do armazenamento.</p>
            <p>As respostas ficam vinculadas ao usuário autenticado e protegidas pelo RLS do Supabase.</p>
            <p>O envio não expõe chaves privilegiadas no navegador.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}