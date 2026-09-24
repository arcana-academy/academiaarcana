import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { QuickAction, SanctuaryUser } from "@/domains/sanctuary";

import { SanctuaryHeader } from "./SanctuaryHeader";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => {
    throw new Error("SanctuaryHeader must not create a Supabase client.");
  },
}));

vi.mock("@/infrastructure/sanctuary/supabase-sanctuary-repository", () => ({
  SupabaseSanctuaryRepository: vi.fn().mockImplementation(() => {
    throw new Error(
      "SanctuaryHeader must not build a sanctuary repository.",
    );
  }),
}));

const user: SanctuaryUser = {
  id: "user-1",
  displayName: "Taynara",
};

const greeting = "Seu Santuário de aprendizagem";

const primaryAction: QuickAction = {
  id: "continue-learning",
  label: "Continuar aprendendo",
  href: "/workspace?view=tree#current",
  priority: "primary",
};

function renderHeader({
  headerUser = user,
  action = primaryAction,
}: {
  headerUser?: SanctuaryUser;
  action?: QuickAction;
} = {}) {
  render(
    <SanctuaryHeader
      header={{ greeting, user: headerUser }}
      primaryAction={action}
    />,
  );
}

describe("SanctuaryHeader", () => {
  it("renders the greeting as the labelled level-one heading", () => {
    renderHeader();

    const heading = screen.getByRole("heading", {
      level: 1,
      name: greeting,
    });

    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute("id", "sanctuary-title");
  });

  it("renders the user identity", () => {
    renderHeader();

    expect(screen.getByTestId("sanctuary-user-name")).toHaveTextContent(
      "Taynara",
    );
  });

  it("trims the display name before rendering it", () => {
    renderHeader({
      headerUser: { id: "user-1", displayName: "  Taynara  " },
    });

    expect(screen.getByTestId("sanctuary-user-name")).toHaveTextContent(
      "Taynara",
    );
  });

  it("omits the identity instead of inventing one when there is no display name", () => {
    renderHeader({ headerUser: { id: "user-2" } });

    expect(
      screen.queryByTestId("sanctuary-user-name"),
    ).not.toBeInTheDocument();
  });

  it("renders the primary action as a semantic link to its href", () => {
    renderHeader();

    const link = screen.getByRole("link", {
      name: "Continuar aprendendo",
    });

    expect(link).toHaveAttribute("href", "/workspace?view=tree#current");
    expect(link.tagName).toBe("A");
  });

  it("renders the supplied primary action without re-deriving its priority", () => {
    renderHeader({
      action: {
        id: "open-workspace",
        label: "Abrir Workspace",
        href: "/workspace?view=tree#current",
        priority: "supporting",
      },
    });

    expect(
      screen.getByRole("link", { name: "Abrir Workspace" }),
    ).toHaveAttribute("href", "/workspace?view=tree#current");
  });

  it("keeps the primary action focusable by keyboard", () => {
    renderHeader();

    const link = screen.getByRole("link", {
      name: "Continuar aprendendo",
    });

    link.focus();

    expect(link).toHaveFocus();
    expect(link).not.toHaveAttribute("tabindex", "-1");
  });

  it("does not depend on Supabase or the sanctuary repository", () => {
    expect(() => renderHeader()).not.toThrow();
    expect(screen.getByTestId("sanctuary-user-name")).toBeInTheDocument();
  });
});
