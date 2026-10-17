// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { StudyTask } from "@/domains/planning";

import { StudyTaskBoard } from "./StudyTaskBoard";

const task: StudyTask = {
  id: "task-1",
  ownerId: "user-1",
  title: "Revisar capítulo",
  dueAt: "2026-09-25T14:00:00.000Z",
  status: "pending",
  completedAt: null,
  createdAt: "2026-09-24T10:00:00.000Z",
  updatedAt: "2026-09-24T10:00:00.000Z",
};

describe("StudyTaskBoard", () => {
  it("creates a task and adds it to the visible schedule through the labeled form", async () => {
    const created = { ...task, id: "task-2", title: "Nova revisão" };
    const onCreate = vi.fn().mockResolvedValue(created);

    render(
      <StudyTaskBoard
        tasks={[task]}
        onCreate={onCreate}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tarefa"), {
      target: { value: "Nova revisão" },
    });
    expect(screen.getByRole("button", { name: "Criar tarefa" })).toHaveAttribute("type", "submit");
    fireEvent.submit(screen.getByRole("form", { name: "Adicionar tarefa de estudo" }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        title: "Nova revisão",
        dueAt: null,
      }),
    );
    expect(await screen.findByText("Nova revisão")).toBeInTheDocument();
    expect(document.querySelector('img[src="/assets/icons/aa-cronograma.svg"]')).toBeInTheDocument();
  });

  it("distinguishes unavailable Outlook events from an empty calendar while preserving study tasks", () => {
    const { rerender } = render(
      <StudyTaskBoard
        tasks={[task]}
        outlookConnected
        outlookEvents={[]}
        outlookEventsUnavailable
        onCreate={vi.fn()}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Não foi possível carregar os eventos do Outlook agora.");
    expect(screen.queryByText("Nenhum evento encontrado no Outlook neste período.")).not.toBeInTheDocument();
    expect(screen.getByText("Revisar capítulo")).toBeInTheDocument();

    rerender(
      <StudyTaskBoard
        tasks={[task]}
        outlookConnected
        outlookEvents={[]}
        outlookEventsUnavailable={false}
        onCreate={vi.fn()}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );
    expect(screen.getByText("Nenhum evento encontrado no Outlook neste período.")).toBeInTheDocument();
    expect(screen.queryByText("Não foi possível carregar os eventos do Outlook agora.")).not.toBeInTheDocument();
  });

  it("offers a direct route to the task form when the schedule is empty", () => {
    render(
      <StudyTaskBoard
        tasks={[]}
        onCreate={vi.fn()}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );

    expect(screen.getByText("Nenhuma tarefa futura cadastrada.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Criar primeira tarefa" })).toHaveAttribute(
      "href",
      "#study-task-title",
    );
  });

  it("removes a completed task from the upcoming list", async () => {
    const onComplete = vi.fn().mockResolvedValue({
      ...task,
      status: "completed",
      completedAt: "2026-09-24T11:00:00.000Z",
    });

    render(
      <StudyTaskBoard
        tasks={[task]}
        onCreate={vi.fn()}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith("task-1"));
    expect(screen.queryByText("Revisar capítulo")).not.toBeInTheDocument();
    expect(screen.getByText("Nenhuma tarefa futura cadastrada.")).toBeInTheDocument();
  });
  it("keeps an overdue task visible and allows completing it", async () => {
    const overdue = {
      ...task,
      id: "task-overdue",
      title: "Revisão pendente vencida",
      dueAt: "2020-01-01T10:00:00.000Z",
    };
    const onComplete = vi.fn().mockResolvedValue({ ...overdue, status: "completed" });

    render(
      <StudyTaskBoard
        tasks={[overdue]}
        onCreate={vi.fn()}
        onComplete={onComplete}
      />,
    );

    expect(screen.getByText("Revisão pendente vencida")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith("task-overdue"));
    expect(screen.queryByText("Revisão pendente vencida")).not.toBeInTheDocument();
  });

  it("shows Outlook scheduling for tasks with a due time and calls the server action", async () => {
    const onScheduleInOutlook = vi.fn().mockResolvedValue({
      webLink: null,
    });

    render(
      <StudyTaskBoard
        tasks={[task]}
        outlookConnected
        onScheduleInOutlook={onScheduleInOutlook}
        onCreate={vi.fn()}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Agendar no Outlook" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Agendar no Outlook" }),
    );

    await waitFor(() =>
      expect(onScheduleInOutlook).toHaveBeenCalledWith("task-1"),
    );
  });

  it("sends a study task to Asana without mutating the native task state", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ task: { id: "asana-task-1", name: task.title } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <StudyTaskBoard
        tasks={[task]}
        onCreate={vi.fn()}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Enviar ao Asana" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/integrations/asana/tasks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: task.title,
          notes: "Enviada a partir do Cronograma da Academia Arcana.",
          dueOn: "2026-09-25",
        }),
      }),
    ));
    expect(screen.getByRole("button", { name: "Enviado ao Asana" })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
  it("keeps Todoist and Asana sends independent on the same task", async () => {
    const releases: Array<(response: Response) => void> = [];
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => {
      releases.push(resolve);
    }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      render(
        <StudyTaskBoard
          tasks={[task]}
          onCreate={vi.fn()}
          onComplete={vi.fn().mockResolvedValue(task)}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Enviar ao Todoist" }));
      fireEvent.click(screen.getByRole("button", { name: "Enviar ao Asana" }));

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/integrations/todoist/tasks", expect.objectContaining({ method: "POST" }),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/integrations/asana/tasks", expect.objectContaining({ method: "POST" }),
      );
      expect(screen.getAllByRole("button", { name: "Enviando…" })).toHaveLength(2);
      for (const release of releases) release(new Response("{}", { status: 201 }));
      expect(await screen.findByRole("button", { name: "Enviado" })).toBeDisabled();
      expect(await screen.findByRole("button", { name: "Enviado ao Asana" })).toBeDisabled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("keeps each task locked until its own Todoist request finishes", async () => {
    const releases: Array<(response: Response) => void> = [];
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => {
      releases.push(resolve);
    }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      render(
        <StudyTaskBoard
          tasks={[task, { ...task, id: "task-2", title: "Revisar página 2" }]}
          onCreate={vi.fn()}
          onComplete={vi.fn().mockResolvedValue(task)}
        />,
      );
      const first = within(screen.getByText("Revisar capítulo").closest("li")!);
      const second = within(screen.getByText("Revisar página 2").closest("li")!);
      fireEvent.click(first.getByRole("button", { name: "Enviar ao Todoist" }));
      fireEvent.click(second.getByRole("button", { name: "Enviar ao Todoist" }));

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(first.getByRole("button", { name: "Enviando…" })).toBeDisabled();
      expect(second.getByRole("button", { name: "Enviando…" })).toBeDisabled();
      releases[1](new Response("{}", { status: 201 }));
      await waitFor(() => expect(second.getByRole("button", { name: "Enviado" })).toBeDisabled());
      expect(first.getByRole("button", { name: "Enviando…" })).toBeDisabled();
      releases[0](new Response("{}", { status: 201 }));
      await waitFor(() => expect(first.getByRole("button", { name: "Enviado" })).toBeDisabled());
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each([
    { provider: "Todoist", endpoint: "/api/integrations/todoist/tasks", done: "Enviado" },
    { provider: "Asana", endpoint: "/api/integrations/asana/tasks", done: "Enviado ao Asana" },
  ])("retries $provider after failed send without duplicate pending POST", async ({ provider, endpoint, done }) => {
    let release: ((response: Response) => void) | undefined;
    const pending = new Promise<Response>((resolve) => { release = resolve; });
    const fetchMock = vi.fn()
      .mockReturnValueOnce(pending)
      .mockResolvedValueOnce(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      render(
        <StudyTaskBoard
          tasks={[task]}
          onCreate={vi.fn()}
          onComplete={vi.fn().mockResolvedValue(task)}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: `Enviar ao ${provider}` }));
      const sending = screen.getByRole("button", { name: "Enviando…" });
      expect(sending).toBeDisabled();
      fireEvent.click(sending);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      release!(new Response("{}", { status: 502 }));
      expect(await screen.findByRole("alert")).toHaveTextContent(`Não foi possível enviar a tarefa para o ${provider}.`);
      fireEvent.click(screen.getByRole("button", { name: `Enviar ao ${provider}` }));
      expect(await screen.findByRole("button", { name: done })).toBeDisabled();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenCalledWith(endpoint, expect.objectContaining({ method: "POST" }));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("prevents duplicate task creation while the first submission is pending", async () => {
    let resolveCreate!: (value: StudyTask) => void;
    const onCreate = vi.fn(() => new Promise<StudyTask>((resolve) => {
      resolveCreate = resolve;
    }));
    render(
      <StudyTaskBoard tasks={[]} onCreate={onCreate} onComplete={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText("Tarefa"), {
      target: { value: "Estudar novas runas" },
    });
    const form = screen.getByRole("form", { name: "Adicionar tarefa de estudo" });
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Criando…" })).toBeDisabled();

    resolveCreate({ ...task, id: "task-new", title: "Estudar novas runas" });
    expect(await screen.findByText("Estudar novas runas")).toBeInTheDocument();
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("blocks a repeated completion while keeping another task independently actionable", async () => {
    const resolvers = new Map<string, (value: StudyTask) => void>();
    const onComplete = vi.fn((id: string) => new Promise<StudyTask>((resolve) => {
      resolvers.set(id, resolve);
    }));
    render(
      <StudyTaskBoard
        tasks={[task, { ...task, id: "task-2", title: "Revisar poções" }]}
        onCreate={vi.fn()}
        onComplete={onComplete}
      />,
    );
    const first = within(screen.getByText("Revisar capítulo").closest("li")!);
    const second = within(screen.getByText("Revisar poções").closest("li")!);

    fireEvent.click(first.getByRole("button", { name: "Concluir" }));
    fireEvent.click(first.getByRole("button", { name: "Concluindo…" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(first.getByRole("button", { name: "Concluindo…" })).toBeDisabled();
    expect(second.getByRole("button", { name: "Concluir" })).toBeEnabled();

    fireEvent.click(second.getByRole("button", { name: "Concluir" }));
    expect(onComplete).toHaveBeenCalledTimes(2);
    resolvers.get("task-2")!({ ...task, id: "task-2", status: "completed" });
    await waitFor(() => expect(screen.queryByText("Revisar poções")).not.toBeInTheDocument());
    expect(first.getByRole("button", { name: "Concluindo…" })).toBeDisabled();

    resolvers.get("task-1")!({ ...task, status: "completed" });
    await waitFor(() => expect(screen.queryByText("Revisar capítulo")).not.toBeInTheDocument());
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it("re-enables a task completion after a rejected request so it can be retried", async () => {
    let rejectComplete!: (reason: Error) => void;
    const onComplete = vi.fn()
      .mockImplementationOnce(() => new Promise<StudyTask>((_, reject) => {
        rejectComplete = reject;
      }))
      .mockResolvedValueOnce({ ...task, status: "completed" });
    render(
      <StudyTaskBoard tasks={[task]} onCreate={vi.fn()} onComplete={onComplete} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    expect(screen.getByRole("button", { name: "Concluindo…" })).toBeDisabled();
    rejectComplete(new Error("synthetic network outage"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Concluir" })).toBeEnabled());
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível concluir a tarefa.");
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Nenhuma tarefa futura cadastrada.")).toBeInTheDocument();
  });

  it("restores the create form after a failed submission so a retry creates only one task", async () => {
    let rejectCreate!: (reason: Error) => void;
    const onCreate = vi.fn()
      .mockImplementationOnce(() => new Promise<StudyTask>((_, reject) => {
        rejectCreate = reject;
      }))
      .mockResolvedValueOnce({ ...task, id: "new-task", title: "Preparar aula" });
    render(
      <StudyTaskBoard tasks={[]} onCreate={onCreate} onComplete={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText("Tarefa"), { target: { value: "Preparar aula" } });
    const form = screen.getByRole("form", { name: "Adicionar tarefa de estudo" });
    fireEvent.submit(form);
    expect(screen.getByRole("button", { name: "Criando…" })).toBeDisabled();
    rejectCreate(new Error("synthetic request failure"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Criar tarefa" })).toBeEnabled());
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível criar a tarefa.");
    fireEvent.submit(form);
    expect(await screen.findByText("Preparar aula")).toBeInTheDocument();
    expect(onCreate).toHaveBeenCalledTimes(2);
  });

});
