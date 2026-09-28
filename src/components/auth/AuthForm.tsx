"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "recover" | "update-password";

type AuthFormProps = {
  mode: AuthMode;
};

const COPY: Record<
  AuthMode,
  {
    title: string;
    eyebrow: string;
    description: string;
    submit: string;
  }
> = {
  login: {
    eyebrow: "Entrada",
    title: "Entrar na Academia",
    description: "Retome sua jornada de aprendizagem.",
    submit: "Entrar",
  },
  signup: {
    eyebrow: "Primeiro acesso",
    title: "Criar sua conta",
    description: "Prepare seu espaço de aprendizagem na Academia Arcana.",
    submit: "Criar conta",
  },
  recover: {
    eyebrow: "Acesso",
    title: "Recuperar acesso",
    description: "Enviaremos instruções para o endereço informado, quando aplicável.",
    submit: "Enviar instruções",
  },
  "update-password": {
    eyebrow: "Segurança",
    title: "Definir nova senha",
    description: "Escolha uma senha nova para continuar com segurança.",
    submit: "Atualizar senha",
  },
};

const GENERIC_AUTH_ERROR =
  "Não foi possível concluir a operação. Tente novamente.";

const MIN_PASSWORD_LENGTH = 8;

const PASSWORD_TOO_SHORT_ERROR =
  "A senha precisa ter pelo menos 8 caracteres.";

function AuthLinks({ mode }: { mode: AuthMode }) {
  if (mode === "login") {
    return (
      <nav className="aa-auth-links" aria-label="Opções de acesso">
        <Link className="aa-text-link" href="/cadastro">
          Criar uma conta
        </Link>
        <Link className="aa-text-link" href="/recuperar-senha">
          Esqueci minha senha
        </Link>
      </nav>
    );
  }

  if (mode === "signup") {
    return (
      <nav className="aa-auth-links" aria-label="Opções de acesso">
        <Link className="aa-text-link" href="/login">
          Já tenho uma conta
        </Link>
      </nav>
    );
  }

  if (mode === "recover" || mode === "update-password") {
    return (
      <nav className="aa-auth-links" aria-label="Opções de acesso">
        <Link className="aa-text-link" href="/login">
          Voltar para entrar
        </Link>
      </nav>
    );
  }

  return null;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();

    try {
      if (mode === "recover") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
        });

        if (error) {
          throw error;
        }

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

        if (error) {
          throw error;
        }

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
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
          },
        });

        if (error) {
          throw error;
        }

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

      if (error) {
        throw error;
      }

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
  const passwordTooShort =
    (mode === "signup" || mode === "update-password") &&
    password.length > 0 &&
    password.length < MIN_PASSWORD_LENGTH;
  const passwordsMismatch =
    mode === "update-password" &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  return (
    <main className="aa-auth-page" aria-labelledby="auth-title">
      <section className="aa-auth-card aa-card aa-card-elevated">
        <header>
          <p className="aa-eyebrow">{copy.eyebrow}</p>
          <h1 id="auth-title">{copy.title}</h1>
          <p>{copy.description}</p>
        </header>

        <form className="aa-form" onSubmit={handleSubmit}>
          {mode !== "update-password" && (
            <Input
              id={emailId}
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          )}

          {mode !== "recover" && (
            <div className="aa-password-group">
              <Input
                id={passwordId}
                name="password"
                type={passwordInputType}
                label="Senha"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={passwordTooShort ? PASSWORD_TOO_SHORT_ERROR : undefined}
              />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? "Ocultar senha" : "Mostrar senha"}
              </Button>
            </div>
          )}

          {mode === "update-password" && (
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
              error={
                passwordsMismatch
                  ? "As senhas precisam ser iguais."
                  : undefined
              }
            />
          )}

          {message ? (
            <p
              className="aa-alert"
              role="alert"
              aria-live="polite"
              data-tone={status === "error" ? "danger" : "success"}
            >
              {message}
            </p>
          ) : null}

          <div className="aa-form-actions">
            <Button
              type="submit"
              loading={status === "loading"}
              size="lg"
            >
              {status === "loading" ? "Processando…" : copy.submit}
            </Button>
          </div>
        </form>

        <AuthLinks mode={mode} />
      </section>
    </main>
  );
}
