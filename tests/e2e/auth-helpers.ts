import { expect, type Page } from "@playwright/test";

export async function waitForAuthFormHydration(page: Page) {
  const password = page.getByLabel("Senha");
  const showPassword = page.getByRole("button", { name: "Mostrar senha" });

  await expect(showPassword).toBeVisible();

  await expect
    .poll(
      async () => {
        await showPassword.click();
        return password.getAttribute("type");
      },
      {
        message: "AuthForm must be hydrated before submitting credentials",
        timeout: 15_000,
        intervals: [250, 500, 1_000],
      },
    )
    .toBe("text");

  await page.getByRole("button", { name: "Ocultar senha" }).click();
  await expect(password).toHaveAttribute("type", "password");
}

export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await waitForAuthFormHydration(page);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/santuario$/, { timeout: 15_000 });
}
