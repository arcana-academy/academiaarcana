// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PageFrameStyleView, PAGE_FRAME_STYLES, pageFrameStorageKey } from "./PageFrameStyleView";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("Optional Brand Book grimoire frames", () => {
  test("defaults to no frame and lists precisely four optional styles", () => {
    const { container } = render(<PageFrameStyleView pageId="frame-new"><article>Página</article></PageFrameStyleView>);
    const control = screen.getByRole("combobox", { name: "Moldura desta página" });
    expect(control).toHaveValue("none");
    expect(PAGE_FRAME_STYLES).toHaveLength(5);
    expect(container.querySelector(".workspace-page-frame")).toHaveAttribute("data-aa-frame-style", "none");
  });

  test("stores a chosen frame per page without changing child content", async () => {
    const { container, unmount } = render(
      <PageFrameStyleView pageId="frame-A"><article>Texto original</article></PageFrameStyleView>,
    );
    const control = screen.getByRole("combobox", { name: "Moldura desta página" });
    for (const style of ["medieval", "alchemy", "ornamental", "minimal"]) {
      fireEvent.change(control, { target: { value: style } });
      expect(container.querySelector(".workspace-page-frame")).toHaveAttribute("data-aa-frame-style", style);
      expect(screen.getByText("Texto original")).toBeTruthy();
    }
    expect(window.localStorage.getItem(pageFrameStorageKey("frame-A"))).toBe("minimal");
    unmount();
    render(<PageFrameStyleView pageId="frame-B"><article>Outra página</article></PageFrameStyleView>);
    expect(screen.getByRole("combobox", { name: "Moldura desta página" })).toHaveValue("none");
    cleanup();
    render(<PageFrameStyleView pageId="frame-A"><article>Texto original</article></PageFrameStyleView>);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Moldura desta página" })).toHaveValue("minimal"));
  });

  test("does not claim durable save when browser storage denies writes", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const { container } = render(<PageFrameStyleView pageId="frame-blocked"><article>Original</article></PageFrameStyleView>);
    fireEvent.change(screen.getByRole("combobox", { name: "Moldura desta página" }), { target: { value: "ornamental" } });
    expect(container.querySelector(".workspace-page-frame")).toHaveAttribute("data-aa-frame-style", "ornamental");
    expect(screen.getByRole("status")).toHaveTextContent(/não foi salva/i);
  });
});
