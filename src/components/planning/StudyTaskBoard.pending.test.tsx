import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StudyTask } from "@/domains/planning";
import { StudyTaskBoard } from "./StudyTaskBoard";

const task: StudyTask = {
  id: "synthetic-task", ownerId: "synthetic-user", title: "Revisão sintética",
  dueAt: null, status: "pending", completedAt: null,
  createdAt: "2026-10-18T12:00:00Z", updatedAt: "2026-10-18T12:00:00Z",
};

describe("pending task mutations", () => {
  it("rejects whitespace-only submissions without invoking creation", () => {
    const onCreate = vi.fn();
    render(<StudyTaskBoard tasks={[]} onCreate={onCreate} onComplete={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Tarefa"), { target: { value: "   " } });
    fireEvent.submit(screen.getByRole("form", { name: "Adicionar tarefa de estudo" }));
    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Criar tarefa" })).toBeDisabled();
  });

  it("keeps the creation input after failure and clears the error and input on a successful retry", async () => {
    const onCreate = vi.fn().mockRejectedValueOnce(new Error("create failed")).mockResolvedValueOnce(task);
    render(<StudyTaskBoard tasks={[]} onCreate={onCreate} onComplete={vi.fn()} />);
    const title = screen.getByLabelText("Tarefa");
    const form = screen.getByRole("form", { name: "Adicionar tarefa de estudo" });
    fireEvent.change(title, { target: { value: task.title } });
    fireEvent.submit(form);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível criar a tarefa.");
    expect(title).toHaveValue(task.title);
    expect(screen.getByRole("button", { name: "Criar tarefa" })).toBeEnabled();
    fireEvent.submit(form);
    expect(await screen.findByText(task.title)).toBeInTheDocument();
    expect(onCreate).toHaveBeenCalledTimes(2);
    expect(title).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("allows different tasks to complete concurrently and retains the other task's pending guard", async () => {
    const second = { ...task, id: "task-2", title: "Revisar poções" };
    let resolveFirst!: (value: StudyTask) => void;
    let resolveSecond!: (value: StudyTask) => void;
    const onComplete = vi.fn()
      .mockImplementationOnce(() => new Promise<StudyTask>((done) => { resolveFirst = done; }))
      .mockImplementationOnce(() => new Promise<StudyTask>((done) => { resolveSecond = done; }));
    render(<StudyTaskBoard tasks={[task, second]} onCreate={vi.fn()} onComplete={onComplete} />);
    const firstRow = screen.getByText(task.title).closest("li")!;
    const secondRow = screen.getByText(second.title).closest("li")!;
    fireEvent.click(within(firstRow).getByRole("button", { name: "Concluir" }));
    fireEvent.click(within(secondRow).getByRole("button", { name: "Concluir" }));
    expect(onComplete.mock.calls).toEqual([[task.id], [second.id]]);
    await act(async () => { resolveSecond({ ...second, status: "completed" }); });
    expect(screen.queryByText(second.title)).not.toBeInTheDocument();
    expect(within(firstRow).getByRole("button", { name: "Concluindo…" })).toBeDisabled();
    expect(screen.getByText(task.title)).toBeInTheDocument();
    await act(async () => { resolveFirst({ ...task, status: "completed" }); });
    expect(screen.queryByText(task.title)).not.toBeInTheDocument();
  });

  it("coalesces repeated form submissions while creation is pending", async () => {
    let resolve!: (value: StudyTask) => void;
    const onCreate = vi.fn(() => new Promise<StudyTask>((done) => { resolve = done; }));
    render(<StudyTaskBoard tasks={[]} onCreate={onCreate} onComplete={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Tarefa"), { target: { value: task.title } });
    const form = screen.getByRole("form", { name: "Adicionar tarefa de estudo" });
    act(() => { fireEvent.submit(form); fireEvent.submit(form); });
    const calls = onCreate.mock.calls.length;
    await act(async () => { resolve(task); });
    expect(calls).toBe(1);
    expect(screen.getAllByText(task.title)).toHaveLength(1);
  });

  it("allows only one completion per pending task and permits retry after failure", async () => {
    let reject!: (reason: Error) => void;
    const onComplete = vi.fn(() => new Promise<StudyTask>((_, fail) => { reject = fail; }));
    render(<StudyTaskBoard tasks={[task]} onCreate={vi.fn()} onComplete={onComplete} />);
    const button = screen.getByRole("button", { name: "Concluir" });
    act(() => { fireEvent.click(button); fireEvent.click(button); });
    const calls = onComplete.mock.calls.length;
    await act(async () => { reject(new Error("synthetic failure")); });
    expect(calls).toBe(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível concluir");
    onComplete.mockResolvedValueOnce({ ...task, status: "completed" });
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(screen.queryByText(task.title)).not.toBeInTheDocument());
    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});
