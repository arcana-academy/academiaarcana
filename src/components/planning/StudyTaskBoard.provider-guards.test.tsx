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
  describe.each([
    { provider: "Todoist", sentLabel: "Enviado", endpoint: "todoist" },
    { provider: "Asana", sentLabel: "Enviado ao Asana", endpoint: "asana" },
  ])("$provider retry boundaries", ({ provider, sentLabel, endpoint }) => {
    it.each([401, 409, 500, "network"])("releases the guard after %s and permits a successful retry", async (failure) => {
      const send = vi.fn();
      if (failure === "network") send.mockRejectedValueOnce(new Error("network failed"));
      else send.mockResolvedValueOnce({ ok: false, status: failure });
      send.mockResolvedValueOnce({ ok: true, status: 201 });
      vi.stubGlobal("fetch", send);
      renderBoard();
      const label = `Enviar ao ${provider}`;
      fireEvent.click(screen.getByRole("button", { name: label }));
      const error = await screen.findByRole("alert");
      expect(error).toHaveTextContent(failure === 401 || failure === 409 ? `Conecte o ${provider}` : `Não foi possível enviar a tarefa para o ${provider}.`);
      expect(screen.getByRole("button", { name: label })).toBeEnabled();
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(await screen.findByRole("button", { name: sentLabel })).toBeDisabled();
      expect(send).toHaveBeenCalledTimes(2);
      expect(send).toHaveBeenLastCalledWith(`/api/integrations/${endpoint}/tasks`, expect.objectContaining({ method: "POST" }));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByText(task.title)).toBeInTheDocument();
    });
  });

  it("tracks simultaneous Todoist sends by task even when responses arrive out of order", async () => {
    const first = deferred<Reply>();
    const second = deferred<Reply>();
    const send = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    vi.stubGlobal("fetch", send);
    const other = { ...task, id: "other-task", title: "Revisar poções" };
    render(<StudyTaskBoard tasks={[task, other]} onCreate={vi.fn()} onComplete={vi.fn()} />);
    const firstRow = screen.getByText(task.title).closest("li")!;
    const secondRow = screen.getByText(other.title).closest("li")!;
    fireEvent.click(within(firstRow).getByRole("button", { name: "Enviar ao Todoist" }));
    fireEvent.click(within(secondRow).getByRole("button", { name: "Enviar ao Todoist" }));
    await act(async () => { second.resolve({ ok: true, status: 201 }); });
    expect(within(secondRow).getByRole("button", { name: "Enviado" })).toBeDisabled();
    const pending = within(firstRow).getByRole("button", { name: "Enviando…" });
    expect(pending).toBeDisabled();
    fireEvent.click(pending);
    expect(send).toHaveBeenCalledTimes(2);
    await act(async () => { first.resolve({ ok: true, status: 201 }); });
    expect(within(firstRow).getByRole("button", { name: "Enviado" })).toBeDisabled();
  });

  it("opens a successful Outlook event once with opener protection", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const schedule = vi.fn().mockResolvedValue({ webLink: "https://outlook.example.test/event/1" });
    renderBoard(schedule);
    fireEvent.click(screen.getByRole("button", { name: "Agendar no Outlook" }));
    const done = await screen.findByRole("button", { name: "Agendado no Outlook" });
    fireEvent.click(done);
    expect(schedule).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledExactlyOnceWith("https://outlook.example.test/event/1", "_blank", "noopener,noreferrer");
  });

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
