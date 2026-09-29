import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EstatisticasPage from "./page";

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

function queryResult(data: unknown) {
  return { data, error: null };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthenticatedUser.mockResolvedValue({ sub: "user-1" });
  mocks.createClient.mockResolvedValue({
    from(table: string) {
      const data = table === "page_progress"
        ? [{ id: "p1", status: "completed" }, { id: "p2", status: "in-progress" }]
        : table === "study_tasks"
          ? [{ id: "t1", status: "completed" }]
          : table === "focus_sessions"
            ? [{ duration_seconds: 1500, completed_at: "2026-09-29T12:00:00Z" }]
            : { xp: 120, streak_days: 4 };
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => queryResult(data),
                then: undefined,
              };
            },
          };
        },
      };
    },
  });
});

describe("EstatisticasPage", () => {
  it("renders metrics derived from persisted learning data", async () => {
    render(await EstatisticasPage());

    expect(screen.getByRole("heading", { name: "Estatísticas", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("1 concluídas · 1 em andamento")).toBeInTheDocument();
    expect(screen.getByText("1 concluídas")).toBeInTheDocument();
    expect(screen.getByText("25 minutos registrados")).toBeInTheDocument();
    expect(screen.getByText("120 XP")).toBeInTheDocument();
    expect(screen.getByText("4 dias")).toBeInTheDocument();
  });
});
