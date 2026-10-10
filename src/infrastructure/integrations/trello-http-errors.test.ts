import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getTrelloBoards,
  TrelloConnectionError,
} from "./trello";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Trello API typed HTTP status provenance", () => {
  it.each([401, 403])("preserves rejected authorization HTTP %i", async (status) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("synthetic rejection", { status })),
    );
    await expect(getTrelloBoards("synthetic-token")).rejects.toMatchObject({
      name: "TrelloConnectionError",
      httpStatus: status,
    });
  });

  it.each([429, 503])("preserves transient provider HTTP %i", async (status) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("synthetic provider outage", { status })),
    );
    await expect(getTrelloBoards("synthetic-token")).rejects.toMatchObject({
      name: "TrelloConnectionError",
      httpStatus: status,
    });
  });

  it("does not attach a misleading HTTP status to network exceptions", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("synthetic TCP reset");
    }));
    await expect(getTrelloBoards("synthetic-token")).rejects.toBeInstanceOf(TypeError);
  });

  it("does not leak upstream response bodies through typed errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("synthetic-secret-marker", { status: 503 })),
    );
    let error: unknown;
    try {
      await getTrelloBoards("synthetic-token");
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(TrelloConnectionError);
    expect((error as Error).message).not.toContain("synthetic-secret-marker");
  });
});
