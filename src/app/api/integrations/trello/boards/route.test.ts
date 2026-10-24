import { beforeEach, describe, expect, it, vi } from "vitest";

const { context, listBoards, createBoard } = vi.hoisted(() => ({
  context: vi.fn(),
  listBoards: vi.fn(),
  createBoard: vi.fn(),
}));

vi.mock("../_lib", () => ({
  getTrelloCredentialsContext: context,
}));

vi.mock("@/infrastructure/integrations/trello", () => {
  class TrelloConnectionError extends Error {
    constructor(
      message: string,
      readonly httpStatus?: number,
    ) {
      super(message);
      this.name = "TrelloConnectionError";
    }
  }

  return {
    TrelloConnectionError,
    getTrelloBoards: listBoards,
    createTrelloBoard: createBoard,
  };
});

import { TrelloConnectionError } from "@/infrastructure/integrations/trello";
import { GET } from "./route";

describe("Trello boards GET error classification", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    context.mockResolvedValue({
      credentials: { subjectId: "synthetic-owner", accessToken: "synthetic-token" },
      status: "connected",
    });
    listBoards.mockResolvedValue({
      output: [{ id: "synthetic-board", name: "Synthetic board" }],
    });
  });

  it("preserves the connected boards response and private no-store cache", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({
      status: "connected",
      boards: [{ id: "synthetic-board", name: "Synthetic board" }],
    });
    expect(listBoards).toHaveBeenCalledWith("synthetic-token");
  });

  it("does not call the provider when the user is disconnected", async () => {
    context.mockResolvedValueOnce({ credentials: null, status: "disconnected" });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "disconnected" });
    expect(listBoards).not.toHaveBeenCalled();
  });

  it("preserves a credential-context reauthorization decision", async () => {
    context.mockResolvedValueOnce({ credentials: null, status: "reauthorization_required" });
    const response = await GET();
    expect(response.status).toBe(401);
    expect((await response.json()).status).toBe("reauthorization_required");
    expect(listBoards).not.toHaveBeenCalled();
  });

  it.each([401, 403])("returns 401 only on provider authorization rejection HTTP %i", async (code) => {
    listBoards.mockRejectedValueOnce(
      new TrelloConnectionError("synthetic auth rejection", code),
    );
    const response = await GET();
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({ status: "reauthorization_required" });
  });

  it.each([429, 500, 503])("returns 502 rather than false reauthorization on HTTP %i", async (code) => {
    listBoards.mockRejectedValueOnce(
      new TrelloConnectionError("synthetic provider outage", code),
    );
    const response = await GET();
    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({ status: "trello_request_failed" });
  });

  it("treats a network exception as a temporary request failure, not revoked auth", async () => {
    listBoards.mockRejectedValueOnce(new TypeError("synthetic network failure"));
    const response = await GET();
    expect(response.status).toBe(502);
    expect((await response.json()).status).toBe("trello_request_failed");
  });

  it("does not return upstream error messages in its JSON body", async () => {
    listBoards.mockRejectedValueOnce(
      new TrelloConnectionError("synthetic-private-diagnostic", 503),
    );
    const response = await GET();
    expect(JSON.stringify(await response.json())).not.toContain("synthetic-private-diagnostic");
  });
});
