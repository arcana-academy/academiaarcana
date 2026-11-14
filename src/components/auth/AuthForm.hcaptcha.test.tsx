// Isolated candidate tests; requires the repository's existing Vitest/React Testing Library.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "./AuthForm";

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  captchaReset: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      updateUser: mocks.updateUser,
    },
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("./HCaptchaChallenge", async () => {
  const React = await import("react");
  return {
    HCaptchaChallenge: React.forwardRef<
      { reset: () => void },
      { onTokenChange: (token: string | null) => void }
    >(function MockHCaptcha({ onTokenChange }, ref) {
      React.useImperativeHandle(ref, () => ({ reset: mocks.captchaReset }));
      return React.createElement(
        "div",
        null,
        React.createElement("button", { type: "button", onClick: () => onTokenChange("synthetic-test-token") }, "Resolver CAPTCHA"),
        React.createElement("button", { type: "button", onClick: () => onTokenChange(null) }, "Expirar CAPTCHA"),
      );
    }),
  };
});

function fillEmail(value = "synthetic@example.test") {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value } });
}
function fillPassword(value = "ComplexPass123!") {
  fireEvent.change(screen.getByLabelText("Senha"), { target: { value } });
}

describe("AuthForm hCaptcha isolated candidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_HCAPTCHA_SITEKEY", "synthetic-public-sitekey");
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
    mocks.updateUser.mockResolvedValue({ error: null });
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(["login", "signup", "recover"] as const)(
    "fails closed in production without a public hCaptcha sitekey: %s",
    async (mode) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_HCAPTCHA_SITEKEY", "");
      render(<AuthForm mode={mode} />);
      fillEmail();
      if (mode !== "recover") fillPassword();
      if (mode === "signup") {
        fireEvent.change(screen.getByLabelText("Confirmar senha"), {
          target: { value: "ComplexPass123!" },
        });
      }
      const submitLabel = mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar instruções";
      fireEvent.click(screen.getByRole("button", { name: submitLabel }));
      expect(await screen.findByRole("alert")).toHaveTextContent("A verificação de segurança está indisponível");
      expect(mocks.signInWithPassword).not.toHaveBeenCalled();
      expect(mocks.signUp).not.toHaveBeenCalled();
      expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
    },
  );

  it("blocks login without CAPTCHA completion", async () => {
    render(<AuthForm mode="login" />);
    fillEmail();
    fillPassword();
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Conclua a verificação de segurança");
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("passes a one-time token on login and resets the widget", async () => {
    render(<AuthForm mode="login" />);
    fillEmail();
    fillPassword();
    fireEvent.click(screen.getByRole("button", { name: "Resolver CAPTCHA" }));
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "synthetic@example.test",
      password: "ComplexPass123!",
      options: { captchaToken: "synthetic-test-token" },
    }));
    expect(mocks.captchaReset).toHaveBeenCalled();
  });

  it("blocks expired CAPTCHA token before login", async () => {
    render(<AuthForm mode="login" />);
    fillEmail();
    fillPassword();
    fireEvent.click(screen.getByRole("button", { name: "Resolver CAPTCHA" }));
    fireEvent.click(screen.getByRole("button", { name: "Expirar CAPTCHA" }));
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Conclua a verificação de segurança");
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("passes CAPTCHA token with signup options", async () => {
    render(<AuthForm mode="signup" />);
    fillEmail();
    fillPassword();
    fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "ComplexPass123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Resolver CAPTCHA" }));
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    await waitFor(() => expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({
      options: expect.objectContaining({ captchaToken: "synthetic-test-token" }),
    })));
  });

  it("passes CAPTCHA token for password recovery without account enumeration", async () => {
    render(<AuthForm mode="recover" />);
    fillEmail();
    fireEvent.click(screen.getByRole("button", { name: "Resolver CAPTCHA" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar instruções" }));
    await waitFor(() => expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      "synthetic@example.test",
      expect.objectContaining({ captchaToken: "synthetic-test-token" }),
    ));
    expect(screen.getByRole("alert")).toHaveTextContent("Se o endereço estiver cadastrado");
  });

  it("does not ask CAPTCHA on authenticated password update", async () => {
    render(<AuthForm mode="update-password" />);
    expect(screen.queryByRole("button", { name: "Resolver CAPTCHA" })).not.toBeInTheDocument();
    fillPassword();
    fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "ComplexPass123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Atualizar senha" }));
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ password: "ComplexPass123!" }));
  });
});
