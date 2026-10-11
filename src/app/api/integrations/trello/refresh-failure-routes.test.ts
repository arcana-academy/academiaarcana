import { beforeEach, describe, expect, it, vi } from "vitest";

const context = vi.hoisted(() => vi.fn());
vi.mock("./_lib", () => ({ getTrelloCredentialsContext: context }));

import { GET as getStatus } from "./status/route";
import { GET as getBoards, POST as createBoard } from "./boards/route";
import { GET as getBoardDetail } from "./boards/[boardId]/route";
import { GET as searchCards, POST as createCard, PATCH as editCard } from "./cards/route";
import { GET as getChecklists, POST as createChecklist } from "./checklists/route";
import { POST as addItem, PATCH as editItem } from "./checklists/items/route";
import { POST as createList } from "./lists/route";

function request(method = "GET") {
  return new Request("https://example.invalid/api/integrations/trello/test", { method });
}

const routes: Array<[string, () => Promise<Response>]> = [
  ["status GET", () => getStatus()],
  ["boards GET", () => getBoards()],
  ["boards POST", () => createBoard(request("POST"))],
  ["board detail GET", () => getBoardDetail(request(), {
    params: Promise.resolve({ boardId: "synthetic-board" }),
  })],
  ["cards GET", () => searchCards(request())],
  ["cards POST", () => createCard(request("POST"))],
  ["cards PATCH", () => editCard(request("PATCH"))],
  ["checklists GET", () => getChecklists(request())],
  ["checklists POST", () => createChecklist(request("POST"))],
  ["checklist items POST", () => addItem(request("POST"))],
  ["checklist items PATCH", () => editItem(request("PATCH"))],
  ["lists POST", () => createList(request("POST"))],
];

describe("Trello routes: expired token and provider outage contract", () => {
  beforeEach(() => {
    context.mockReset();
    context.mockResolvedValue({ credentials: null, status: "request_failed" });
  });

  it.each(routes)("%s returns temporary HTTP 502 rather than false reauthorization", async (_name, run) => {
    const response = await run();
    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const body = await response.json() as { status?: string; error?: string };
    expect(body.status ?? body.error).toBe("request_failed");
  });
});
