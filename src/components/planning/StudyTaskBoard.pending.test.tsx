import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StudyTask } from "@/domains/planning";
import { StudyTaskBoard } from "./StudyTaskBoard";

const task: StudyTask = {
  id: "synthetic-task", ownerId: "synthetic-user", title: "Revisão sintética",
  dueAt: null, status: "pending", completedAt: null,
  createdAt: "2026-10-18T12:00:00Z", updatedAt: "2026-10-18T12:00:00Z",
};

describe("pending task mutations", () => {
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
