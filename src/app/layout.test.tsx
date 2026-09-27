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
  it("resolve a identidade da aplicação antes de montar os providers globais", async () => {
    const element = await RootLayout({
      children: <div>Teste</div>,
    });

    expect(element.type).toBe("html");

    const body = element.props.children;
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
