import { expect, test } from "@playwright/test";

import {
  loginWithCredentials,
  waitForAuthFormHydration,
} from "./auth-helpers";

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;
const e2eSignupEmail = process.env.E2E_SIGNUP_EMAIL;

test.describe("P0 essential authenticated flows", () => {
  test.skip(
    !e2eEmail || !e2ePassword,
    "Configure the local authenticated E2E fixture.",
  );

  test("creates and completes a study task, then surfaces the resulting mission", async ({
    page,
  }) => {
    if (!e2eEmail || !e2ePassword) {
      test.skip();
      return;
    }

    await loginWithCredentials(page, e2eEmail, e2ePassword);

    await page.goto("/cronograma");
    await expect(
      page.getByRole("heading", { name: "Cronograma", exact: true }),
    ).toBeVisible();

    const title = `E2E tarefa essencial ${Date.now()}`;
    await page.getByLabel("Tarefa").fill(title);
    await page.getByRole("button", { name: "Criar tarefa" }).click();

    const task = page.getByRole("listitem").filter({ hasText: title });
    await expect(task).toBeVisible();

    await task.getByRole("button", { name: "Concluir" }).click();
    await expect(task).toHaveCount(0);

    await page.goto("/missoes");
    await expect(
      page.getByRole("heading", { name: "Missões", exact: true }),
    ).toBeVisible();

    const missions = page.getByRole("list", { name: "Missões de hoje" });
    await expect(missions).toBeVisible();
    await expect(missions.getByRole("listitem").first()).toContainText(
      "concluída",
    );
  });

  test("starts, pauses and resumes a focus session without waiting for completion", async ({
    page,
  }) => {
    if (!e2eEmail || !e2ePassword) {
      test.skip();
      return;
    }

    await loginWithCredentials(page, e2eEmail, e2ePassword);

    await page.goto("/foco");
    await expect(
      page.getByRole("heading", { name: "Foco", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Iniciar sessão" }).click();
    await expect(page.getByText("Em andamento", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Pausar sessão" }).click();
    await expect(page.getByText("Pausada", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Iniciar sessão" }).click();
    await expect(page.getByText("Em andamento", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Pausar sessão" }).click();
    await expect(page.getByText("Pausada", { exact: true })).toBeVisible();
  });

  test("opens important authenticated settings with accessibility and security controls", async ({
    page,
  }) => {
    if (!e2eEmail || !e2ePassword) {
      test.skip();
      return;
    }

    await loginWithCredentials(page, e2eEmail, e2ePassword);

    await page.goto("/configuracoes");
    await expect(
      page.getByRole("heading", { name: "Configurações", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Acessibilidade", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Segurança", exact: true }),
    ).toBeVisible();
  });
});

test.describe("P0 essential onboarding", () => {
  test.skip(
    !e2eSignupEmail || !e2ePassword,
    "Configure the local signup E2E fixture.",
  );

  test("creates a local account through the public signup flow", async ({
    page,
  }) => {
    if (!e2eSignupEmail || !e2ePassword) {
      test.skip();
      return;
    }

    await page.goto("/cadastro");
    await waitForAuthFormHydration(page);

    await page.getByLabel("Email").fill(e2eSignupEmail);
    await page.getByLabel("Senha").fill(e2ePassword);
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByRole("alert")).toContainText("Conta criada", {
      timeout: 15_000,
    });
  });
});
