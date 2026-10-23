// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PagePaperStyleView, pagePaperStorageKey } from "./PagePaperStyleView";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("Robustez das preferências visuais no navegador", () => {
  it("não interrompe a leitura quando outra aba envia uma chave inválida", () => {
    render(
      <PagePaperStyleView pageId="synthetic-page">
        <p>Conteúdo de aprendizagem preservado</p>
      </PagePaperStyleView>,
    );

    const errors: ErrorEvent[] = [];
    const trackError = (event: ErrorEvent) => {
      errors.push(event);
      event.preventDefault();
    };
    window.addEventListener("error", trackError);
    try {
      window.dispatchEvent(new StorageEvent("storage", {
        key: "academia-arcana.page-paper.v1:%invalid-encoding",
      }));
    } finally {
      window.removeEventListener("error", trackError);
    }

    expect(errors).toHaveLength(0);
    expect(screen.getByText("Conteúdo de aprendizagem preservado")).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Estilo do papel desta página" }))
      .toHaveValue("inherit");
  });

  it("respeita a remoção externa de preferência sem alterar conteúdo", () => {
    window.localStorage.setItem(pagePaperStorageKey("other-page"), "lilas");
    render(
      <PagePaperStyleView pageId="other-page">
        <p>Rascunho intacto</p>
      </PagePaperStyleView>,
    );
    expect(screen.getByRole("combobox", { name: "Estilo do papel desta página" })).toHaveValue("lilas");

    window.localStorage.removeItem(pagePaperStorageKey("other-page"));
    window.dispatchEvent(new StorageEvent("storage", {
      key: pagePaperStorageKey("other-page"),
      oldValue: "lilas",
      newValue: null,
    }));

    expect(screen.getByRole("combobox", { name: "Estilo do papel desta página" })).toHaveValue("inherit");
    expect(screen.getByText("Rascunho intacto")).toBeVisible();
  });
});
