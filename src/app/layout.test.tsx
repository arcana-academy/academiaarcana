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

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => null,
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("usa ApplicationProviders como composição global da aplicação", () => {
    const element = RootLayout({
      children: <div>Teste</div>,
    });

    expect(element).toBeDefined();
    expect(element.type).toBe("html");

    const body = element.props.children;
    const bodyChildren = body.props.children;

    // Body now has two children: ApplicationProviders and Analytics
    expect(Array.isArray(bodyChildren)).toBe(true);
    expect(bodyChildren[0].type).toBe(applicationProvidersMock);
  });
});
