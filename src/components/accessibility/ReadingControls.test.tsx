// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReadingControls } from "./ReadingControls";

const storageKey = "academia-arcana:reading-preferences";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("ReadingControls", () => {
  it("stores voluntary reading preferences on this device and restores them", () => {
    const first = render(<ReadingControls />);
    expect(screen.getByLabelText("Tamanho do texto")).toHaveValue("normal");

    fireEvent.change(screen.getByLabelText("Tamanho do texto"), {
      target: { value: "large" },
    });
    fireEvent.change(screen.getByLabelText("Fonte de leitura"), {
      target: { value: "literata" },
    });
    fireEvent.click(screen.getByLabelText("Espaçamento confortável"));
    fireEvent.click(screen.getByLabelText("Contraste reforçado"));
    fireEvent.click(screen.getByLabelText("Modo Foco"));

    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toEqual({
      size: "large",
      font: "literata",
      spacing: true,
      contrast: true,
      focus: true,
    });

    first.unmount();
    render(<ReadingControls />);
    expect(screen.getByLabelText("Tamanho do texto")).toHaveValue("large");
    expect(screen.getByLabelText("Fonte de leitura")).toHaveValue("literata");
    expect(screen.getByLabelText("Modo Foco")).toBeChecked();
  });

  it("ignores malformed or out-of-contract local values", () => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      size: "untrusted", font: "default", spacing: false, contrast: false, focus: false,
    }));
    render(<ReadingControls />);
    expect(screen.getByLabelText("Tamanho do texto")).toHaveValue("normal");
    expect(screen.getByLabelText("Modo Foco")).not.toBeChecked();
  });

  it("keeps successive changes functional when local storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    render(<ReadingControls />);
    fireEvent.click(screen.getByLabelText("Modo Foco"));
    fireEvent.click(screen.getByLabelText("Espaçamento confortável"));
    expect(screen.getByLabelText("Modo Foco")).toBeChecked();
    expect(screen.getByLabelText("Espaçamento confortável")).toBeChecked();
  });
});
