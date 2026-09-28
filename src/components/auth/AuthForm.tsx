"use client";

import { FormEvent, useId, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "recover" | "update-password";

type AuthFormProps = {
  mode: AuthMode;
};

const COPY: Record<AuthMode, { eyebrow: string; title: string; description: string; submit: string }> = {
  login: {
    eyebrow: "Acesso à Academia",
    title: "Entrar",
    description: "Continue sua jornada de aprendizagem.",
    submit: "Entrar",
  },
  signup: {
    eyebrow: "Primeiro passo",
    title: "Criar conta",
    description: "Prepare seu espaço de estudo na Academia Arcana.",
    submit: "Criar conta",
  },
  recover: {
    eyebrow: "Recuperar acesso",
    title: "Recuperar sua conta",
    description: "Envie seu email para receber as instruções de recuperação.",
    submit: "Enviar instruções",
  },
  "update-password": {
    eyebrow: "Segurança",
    title: "Definir nova senha",
    description: "Escolha uma senha forte para proteger seu acesso.",
    submit: "Atualizar senha",
  },
};

const GENERIC_AUTH_ERROR =
  "Não foi possível concluir a operação. Confira os dados e tente novamente.";

const MIN_PASSWORD_LENGTH = 8;

const PASSWORD_TOO_SHORT_ERROR =
  "A senha precisa ter pelo menos 8 caracteres.";

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();

    try {
      if (mode === "recover") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/auth/callback?next=/redefinir-senha",
        });

        if (error) throw error;

        setStatus("success");
        setMessage(
          "Se o endereço estiver cadastrado, você receberá as instruções para recuperar o acesso.",
        );
        return;
      }

      if (mode === "update-password") {
        if (password !== confirmPassword) {
          setStatus("error");
          setMessage("As senhas precisam ser iguais.");
          return;
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
          setStatus("error");
          setMessage(PASSWORD_TOO_SHORT_ERROR);
          return;
        }

        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        setStatus("success");
        setMessage("Senha atualizada com sucesso.");
        return;
      }

      if (mode === "signup" && password.length < MIN_PASSWORD_LENGTH) {
        setStatus("error");
        setMessage(PASSWORD_TOO_SHORT_ERROR);
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth/callback?next=/",
          },
        });

        if (error) throw error;

        setStatus("success");
        setMessage(
          data.session
            ? "Conta criada com sucesso."
            : "Conta criada. Verifique seu email para confirmar o acesso, se a confirmação estiver habilitada.",
        );
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setStatus("success");
      router.push("/santuario");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage(GENERIC_AUTH_ERROR);
    }
  }

  const copy = COPY[mode];
  const passwordInputType = showPassword ? "text" : "password";
  const isError = status === "error";

  return (
    <main className="aa-auth-page" aria-labelledby="auth-title">
      <section className="aa-card aa-card-elevated aa-auth-card">
        <header>
          <p className="aa-eyebrow">{copy.eyebrow}</p>
          <h1 id="auth-title">{copy.title}</h1>
          <p>{copy.description}</p>
        </header>

        <form className="aa-form" onSubmit={handleSubmit} noValidate>
          {mode !== "update-password" ? (
            <Input
              id={emailId}
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              description={mode === "recover" ? "Usaremos este endereço apenas para iniciar a recuperação." : undefined}
            />
          ) : null}

          {mode !== "recover" ? (
            <fieldset className="aa-auth-fieldset">
              <legend className="aa-visually-hidden">Senha</legend>

              <div className="aa-password-field">
                <label htmlFor={passwordId}>Senha</label>
                <div className="aa-password-control">
                  <Input
                    id={passwordId}
                    name="password"
                    type={passwordInputType}
                    label={undefined}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    error={undefined}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                    <span className="aa-visually-hidden">
                      {showPassword ? "Ocultar senha" : "Mostrar senha"}
                    </span>
                  </Button>
                </div>
              </div>

              {mode === "update-password" ? (
                <Input
                  id={confirmPasswordId}
                  name="confirm-password"
                  type={passwordInputType}
                  label="Confirmar senha"
                  autoComplete="new-password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  error={undefined}
                />
              ) : null}
            </fieldset>
          ) : null}

          {message ? (
            <p
              className="aa-auth-status"
              data-status={status}
              role={status === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {status === "success" ? (
                <ShieldCheck size={18} aria-hidden="true" />
              ) : isError ? (
                <LockKeyhole size={18} aria-hidden="true" />
              ) : (
                <Mail size={18} aria-hidden="true" />
              )}
              <span>{message}</span>
            </p>
          ) : null}

          <div className="aa-form-actions">
            <Button type="submit" loading={status === "loading"} size="lg">
              {copy.submit}
            </Button>

            {mode === "login" ? (
              <Link className="aa-button aa-button-secondary aa-button-lg" href="/cadastro">
                Criar conta
              </Link>
            ) : null}

            {mode === "signup" ? (
              <Link className="aa-button aa-button-secondary aa-button-lg" href="/login">
                Já tenho uma conta
              </Link>
            ) : null}

            {mode === "recover" ? (
              <Link className="aa-button aa-button-secondary aa-button-lg" href="/login">
                Voltar para entrar
              </Link>
            ) : null}
          </div>

          {mode === "login" ? (
            <p className="aa-form-footer">
              Esqueceu a senha? <Link className="aa-link" href="/recuperar-senha">Recupere o acesso</Link>.
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
