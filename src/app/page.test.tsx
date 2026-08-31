import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Page from "./page";

describe("Academia Arcana home", () => {
  it("renders the accessible application heading", () => {
    const html = renderToStaticMarkup(<Page />);
    expect(html).toContain("<h1>Academia Arcana</h1>");
  });
});
