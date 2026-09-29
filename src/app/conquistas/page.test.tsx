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

type QueryResult = { data: unknown; error: null };
type QueryBuilder = {
  select: () => QueryBuilder;
  eq: () => QueryBuilder;
  maybeSingle: () => Promise<QueryResult>;
  then: Promise<QueryResult>["then"];
};

function chain(data: unknown): QueryBuilder {
  const builder = {} as QueryBuilder;
  builder.select = () => builder;
  builder.eq = () => builder;
  builder.maybeSingle = async () => ({ data, error: null });
  builder.then = (resolve, reject) => Promise.resolve({ data, error: null }).then(resolve, reject);
  return builder;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthenticatedUser.mockResolvedValue({ sub: "user-1" });
  mocks.createClient.mockResolvedValue({
    from(table: string) {
      const data = table === "gamification_profiles"
        ? { xp: 100, streak_days: 7 }
        : [{ id: "t1" }];
      return chain(data);
    },
  });
});

describe("ConquistasPage", () => {
  it("derives achievements from real progress", async () => {
    render(await ConquistasPage());

    expect(screen.getByRole("heading", { name: "Conquistas", level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText("Desbloqueada")).toHaveLength(3);
  });
});
