import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StudyTask } from "@/domains/planning";
import { StudyTaskBoard } from "./StudyTaskBoard";

const task: StudyTask = {
  id: "synthetic-provider-1",
  ownerId: "synthetic-owner",
  title: "Revisar runas",
  dueAt: "2026-10-18T14:00:00Z",
  status: "pending",
  completedAt: null,
  createdAt: "2026-10-17T10:00:00Z",
  updatedAt: "2026-10-17T10:00:00Z",
};
type Reply = { ok: boolean; status: number };
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const renderBoard = (schedule?: (id: string) => Promise<{webLink?: string | null}>) =>
  render(<StudyTaskBoard tasks={[task]} outlookConnected={Boolean(schedule)}
    onCreate={vi.fn()} onComplete={vi.fn()} onScheduleInOutlook={schedule} />);

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("provider sends: synchronous duplicate guards", () => {
  it.each([
    ["Todoist", "todoist"], ["Asana", "asana"],
  ])("allows %s retries after connection errors and network failures", async (provider, slug) => {
    const send = vi.fn().mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: false, status: 409 })
      .mockRejectedValueOnce(new Error("synthetic network failure"))
      .mockResolvedValueOnce({ ok: true, status: 201 });
    vi.stubGlobal("fetch", send);
    renderBoard();

    for (const status of [401, 409, "network"]) {
      fireEvent.click(screen.getByRole("button", { name: `Enviar ao ${provider}` }));
      expect(await screen.findByRole("alert")).toHaveTextContent(status === "network"
        ? `Não foi possível enviar a tarefa para o ${provider}.`
        : `Conecte o ${provider} em Integrações antes de enviar esta tarefa.`);
      expect(screen.getByRole("button", { name: `Enviar ao ${provider}` })).toBeEnabled();
    }
    fireEvent.click(screen.getByRole("button", { name: `Enviar ao ${provider}` }));
    const sentLabel = provider === "Todoist" ? "Enviado" : "Enviado ao Asana";
    const sent = await screen.findByRole("button", { name: sentLabel });
    expect(sent).toBeDisabled();
    fireEvent.click(sent);
    expect(send).toHaveBeenCalledTimes(4);
    expect(send).toHaveBeenLastCalledWith(`/api/integrations/${slug}/tasks`, expect.objectContaining({ method: "POST" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText(task.title)).toBeInTheDocument();
  });

  it.each(["Todoist", "Asana", "Outlook"])(
    "keeps a second %s action pending when the first task finishes",
    async (provider) => {
      const first = deferred<Reply & { webLink: null }>();
      const second = deferred<Reply & { webLink: null }>();
      const send = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
      vi.stubGlobal("fetch", send);
      const other = { ...task, id: "second-provider-task", title: "Estudar poções" };
      render(<StudyTaskBoard tasks={[task, other]} outlookConnected
        onCreate={vi.fn()} onComplete={vi.fn()} onScheduleInOutlook={send} />);
      const firstRow = within(screen.getByText(task.title).closest("li")!);
      const secondRow = within(screen.getByText(other.title).closest("li")!);
      const label = provider === "Outlook" ? "Agendar no Outlook" : `Enviar ao ${provider}`;
      fireEvent.click(firstRow.getByRole("button", { name: label }));
      fireEvent.click(secondRow.getByRole("button", { name: label }));
      expect(send).toHaveBeenCalledTimes(2);

      await act(async () => { first.resolve({ ok: true, status: 201, webLink: null }); });
      const pendingLabel = provider === "Outlook" ? "Agendando…" : "Enviando…";
      const pending = secondRow.getByRole("button", { name: pendingLabel });
      expect(pending).toBeDisabled();
      fireEvent.click(pending);
      expect(send).toHaveBeenCalledTimes(2);
      await act(async () => { second.resolve({ ok: true, status: 201, webLink: null }); });
      const doneLabel = provider === "Outlook" ? "Agendado no Outlook"
        : provider === "Asana" ? "Enviado ao Asana" : "Enviado";
      expect(firstRow.getByRole("button", { name: doneLabel })).toBeDisabled();
      expect(secondRow.getByRole("button", { name: doneLabel })).toBeDisabled();
    },
  );

  it("coalesces repeated Todoist clicks while pending and prevents resend after success", async () => {
    const response = deferred<Reply>();
    const send = vi.fn(() => response.promise);
    vi.stubGlobal("fetch", send);
    renderBoard();
    const button = screen.getByRole("button", { name: "Enviar ao Todoist" });
    act(() => { fireEvent.click(button); fireEvent.click(button); });
    expect(send).toHaveBeenCalledTimes(1);
    await act(async () => { response.resolve({ ok: true, status: 201 }); });
    expect(await screen.findByRole("button", { name: "Enviado" })).toBeDisabled();
  });

  it("sends Todoist and Asana independently, coalesces each pair, and retries a failed provider", async () => {
    const todoist = deferred<Reply>();
    const asana = deferred<Reply>();
    let todoistCalls = 0;
    const send = vi.fn((url: string) => {
      if (url.includes("/todoist/")) {
        todoistCalls += 1;
        return todoistCalls === 1 ? todoist.promise : Promise.resolve({ok:true,status:201});
      }
      return asana.promise;
    });
    vi.stubGlobal("fetch", send);
    renderBoard();
    const t = screen.getByRole("button", { name: "Enviar ao Todoist" });
    const a = screen.getByRole("button", { name: "Enviar ao Asana" });
    act(() => { fireEvent.click(t); fireEvent.click(t); fireEvent.click(a); fireEvent.click(a); });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls.filter(([url]) => url.includes("/todoist/"))).toHaveLength(1);
    expect(send.mock.calls.filter(([url]) => url.includes("/asana/"))).toHaveLength(1);
    await act(async () => {
      todoist.resolve({ok:false,status:500});
      asana.resolve({ok:true,status:201});
    });
    await waitFor(() => expect(screen.getByRole("button", {name:"Enviado ao Asana"})).toBeDisabled());
    fireEvent.click(screen.getByRole("button", {name:"Enviar ao Todoist"}));
    await waitFor(() => expect(send).toHaveBeenCalledTimes(3));
  });

  it("coalesces Outlook scheduling, allows retry after failure, and blocks repeated success", async () => {
    const first = deferred<{webLink?: string|null}>();
    const second = deferred<{webLink?: string|null}>();
    const schedule = vi.fn().mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    renderBoard(schedule);
    const button = screen.getByRole("button", {name:"Agendar no Outlook"});
    act(() => { fireEvent.click(button); fireEvent.click(button); });
    expect(schedule).toHaveBeenCalledTimes(1);
    await act(async () => { first.reject(new Error("SYNTHETIC_ERROR")); });
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível criar o evento");
    const retry = screen.getByRole("button", {name:"Agendar no Outlook"});
    fireEvent.click(retry);
    await act(async () => { second.resolve({webLink:null}); });
    expect(schedule).toHaveBeenCalledTimes(2);
    const done = screen.getByRole("button", {name:"Agendado no Outlook"});
    expect(done).toBeDisabled();
  });
});
