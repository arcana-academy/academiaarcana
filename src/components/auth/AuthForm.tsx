"use client";

import { FormEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "recover" | "update-password";

type AuthFormProps = {
  mode: AuthMode;
};

const COPY: Record<AuthMode, { title: string; submit: string }> = {
  login: { title: "Entrar", submit: "Entrar" },
  signup: { title: "Criar conta", submit: "Criar conta" },
  recover: {
    title: "Recuperar acesso",
    submit: "Enviar instruções",
  },
  "update-password": {
    title: "Definir nova senha",
    submit: "Atualizar senha",
  },
};

const GENERIC_AUTH_ERROR =
  "Não foi possível concluir a operação. Tente novamente.";

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

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
          throw error;
        }

        setStatus("success");
        setMessage("Senha atualizada com sucesso.");
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
      router.push("/");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage(GENERIC_AUTH_ERROR);
    }
  }

  const copy = COPY[mode];
  const passwordInputType = showPassword ? "text" : "password";

  return (
    <main aria-labelledby="auth-title">
      <h1 id="auth-title">{copy.title}</h1>

      <form onSubmit={handleSubmit} noValidate>
        {mode !== "update-password" && (
          <div>
            <label htmlFor={emailId}>Email</label>
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={status === "error"}
            />
          </div>
        )}

        {mode !== "recover" && (
          <div>
            <label htmlFor={passwordId}>Senha</label>
            <input
              id={passwordId}
              name="password"
              type={passwordInputType}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={status === "error"}
            />

            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-pressed={showPassword}
            >
              {showPassword ? "Ocultar senha" : "Mostrar senha"}
            </button>
          </div>
        )}

        {mode === "update-password" && (
          <div>
            <label htmlFor={confirmPasswordId}>Confirmar senha</label>
            <input
              id={confirmPasswordId}
              name="confirm-password"
              type={passwordInputType}
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              aria-invalid={status === "error"}
            />
          </div>
        )}

        {message && (
          <p role="alert" aria-live="polite">
            {message}
          </p>
        )}

        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Processando…" : copy.submit}
        </button>
      </form>
    </main>
  );
}
