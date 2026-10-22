import { describe, expect, it, vi } from "vitest";

const applicationProvidersMock = vi.hoisted(() =>
  vi.fn(
    ({
      children,
    }: {
      children: React.ReactNode;
    }) => children,
  ),
);

const resolveSubjectIdServerMock = vi.hoisted(() =>
  vi.fn(() => async () => "user-1"),
);

vi.mock("@/application/providers/ApplicationProviders", () => ({
  ApplicationProviders: applicationProvidersMock,
}));

vi.mock("@/lib/identity/resolve-subject-id-server", () => ({
  createResolveSubjectIdServer: resolveSubjectIdServerMock,
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("expõe as famílias tipográficas aprovadas sem substituir a fonte Adobe existente", async () => {
    const element = await RootLayout({ children: <div>Exemplo</div> });
    const htmlChildren = Array.isArray(element.props.children)
      ? element.props.children
      : [element.props.children];
    const head = htmlChildren.find((child: { type?: unknown }) => child?.type === "head");
    const links = Array.isArray(head.props.children) ? head.props.children : [head.props.children];
    const typographyLink = links.find(
      (child: { props?: { rel?: string; href?: string } }) =>
        child?.props?.rel === "stylesheet" && child?.props?.href?.includes("fonts.googleapis.com/css2"),
    );
    expect(typographyLink.props.href).toContain("family=Grenze");
    expect(typographyLink.props.href).toContain("family=Smythe");
    expect(typographyLink.props.href).toContain("family=Cormorant+Upright");
    expect(typographyLink.props.href).toContain("family=Literata");
  });

  it("resolve a identidade da aplicação antes de montar os providers globais", async () => {
    const element = await RootLayout({
      children: <div>Teste</div>,
    });

    expect(element.type).toBe("html");

    const htmlChildren = Array.isArray(element.props.children)
      ? element.props.children
      : [element.props.children];
    const body = htmlChildren.find(
      (child: { type?: unknown }) => child?.type === "body",
    );
    const applicationProviders = body.props.children;

    expect(applicationProviders.type).toBe(applicationProvidersMock);
    expect(applicationProviders.props.identity).toEqual({
      status: "authenticated",
      identity: {
        subjectId: "user-1",
        status: "active",
      },
      error: null,
    });
    expect(resolveSubjectIdServerMock).toHaveBeenCalledTimes(1);
  });
});
