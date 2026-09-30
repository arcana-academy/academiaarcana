import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: vi.fn(async () => ({ sub: "user-1" })),
}));

vi.mock("@/components/layout/AuthenticatedShell", () => ({
  AuthenticatedShell: ({
    children,
    currentPath,
  }: {
    children: React.ReactNode;
    currentPath: string;
  }) => (
    <div data-current-path={currentPath}>
      {children}
    </div>
  ),
}));

import AcademiaPage from "./page";

describe("AcademiaPage", () => {
  it("requires authentication and renders the existing learning entry points", async () => {
    const html = renderToStaticMarkup(await AcademiaPage());

    expect(html).toContain('data-current-path="/academia"');
    expect(html).toContain('id="academia-title"');
    expect(html).toContain('href="/workspace"');
    expect(html).toContain('href="/cronograma"');
    expect(html).toContain('href="/santuario"');
    expect(html).toContain("/assets/icons/aa-workspace.svg");
    expect(html).toContain("/assets/icons/aa-cronograma.svg");
    expect(html).toContain("/assets/icons/aa-sanctuary.svg");
  });
});
