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

vi.mock(
  "@/application/providers/ApplicationProviders",
  () => ({
    ApplicationProviders: applicationProvidersMock,
  }),
);

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("usa ApplicationProviders como composição global da aplicação", () => {
    const element = RootLayout({
      children: <div>Teste</div>,
    });

    expect(element).toBeDefined();
    expect(element.type).toBe("html");

    const body = element.props.children;
    const applicationProviders =
      body.props.children;

    expect(applicationProviders.type).toBe(
      applicationProvidersMock,
    );
  });
});