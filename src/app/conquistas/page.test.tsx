import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ConquistasPage from "./page";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/lib/auth/require-authenticated-user", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthenticatedUser.mockResolvedValue({ sub: "user-1" });
  mocks.createClient.mockResolvedValue({
    from(table: string) {
      const data = table === "gamification_profiles"
        ? { xp: 100, streak_days: 7 }
        : table === "study_tasks"
          ? [{ id: "t1" }]
          : [{ id: "p1" }];
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({ data, error: null }),
              };
            },
          };
        },
      };
    },
  });
});

describe("ConquistasPage", () => {
  it("derives achievements from real progress", async () => {
    render(await ConquistasPage());

    expect(screen.getByRole("heading", { name: "Conquistas", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Desbloqueada")).toHaveLength(3);
  });
});
