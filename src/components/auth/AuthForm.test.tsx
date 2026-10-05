import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "./AuthForm";

const signInWithPassword = vi.fn();
const signUp = vi.fn();
const resetPasswordForEmail = vi.fn();
const updateUser = vi.fn();
const push = vi.fn();
const refresh = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword,
      signUp,
      resetPasswordForEmail,
      updateUser,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

describe("AuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    signInWithPassword.mockResolvedValue({ error: null });
    signUp.mockResolvedValue({ data: { session: null }, error: null });
    resetPasswordForEmail.mockResolvedValue({ error: null });
    updateUser.mockResolvedValue({ error: null });
  });


  it("uses POST as the native fallback so credentials never enter the URL before hydration", () => {
    render(<AuthForm mode="login" />);

    const form = screen.getByRole("button", { name: "Entrar" }).closest("form");

    expect(form).not.toBeNull();
    expect(form?.getAttribute("method")).toBe("post");
  });

  it("submits login credentials and redirects to the sanctuary after success", async () => {
    render(<AuthForm mode="login" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "student@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "correct-password" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: "student@example.com",
        password: "correct-password",
      });
      expect(push).toHaveBeenCalledWith("/santuario");
      expect(refresh).toHaveBeenCalled();
    });
  });

  it("shows a non-sensitive error when login fails", async () => {
    signInWithPassword.mockResolvedValueOnce({
      error: new Error("Invalid login credentials"),
    });

    render(<AuthForm mode="login" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "student@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "wrong-password" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "Não foi possível concluir a operação. Tente novamente.",
      );
    });
  });

  it("does not enumerate accounts during password recovery", async () => {
    render(<AuthForm mode="recover" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "student@example.com" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Enviar instruções" }),
    );

    await waitFor(() => {
      expect(resetPasswordForEmail).toHaveBeenCalledWith(
        "student@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining(
            "/auth/callback?next=/redefinir-senha",
          ),
        }),
      );

      expect(screen.getByRole("alert").textContent).toContain(
        "Se o endereço estiver cadastrado, você receberá as instruções para recuperar o acesso.",
      );
    });
  });

  it("requires matching passwords before updating them", async () => {
    render(<AuthForm mode="update-password" />);

    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "new-password" },
    });

    fireEvent.change(screen.getByLabelText("Confirmar senha"), {
      target: { value: "different-password" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Atualizar senha" }),
    );

    expect(updateUser).not.toHaveBeenCalled();

    expect(screen.getByRole("alert").textContent).toContain(
      "As senhas precisam ser iguais.",
    );
  });

  it("rejects a password shorter than eight characters when updating", async () => {
    render(<AuthForm mode="update-password" />);

    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "1234567" },
    });

    fireEvent.change(screen.getByLabelText("Confirmar senha"), {
      target: { value: "1234567" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Atualizar senha" }),
    );

    expect(updateUser).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "A senha precisa ter pelo menos 8 caracteres.",
    );
  });

  it("rejects a password shorter than eight characters during signup", async () => {
    render(<AuthForm mode="signup" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "student@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "1234567" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Criar conta" }),
    );

    expect(signUp).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "A senha precisa ter pelo menos 8 caracteres.",
    );
  });

  it("updates the password when confirmation matches", async () => {
    render(<AuthForm mode="update-password" />);

    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "new-password" },
    });

    fireEvent.change(screen.getByLabelText("Confirmar senha"), {
      target: { value: "new-password" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Atualizar senha" }),
    );

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledTimes(1);
      expect(updateUser).toHaveBeenCalledWith({ password: "new-password" });
      expect(screen.getByRole("alert").textContent).toContain(
        "Senha atualizada com sucesso.",
      );
    });

    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });
});
