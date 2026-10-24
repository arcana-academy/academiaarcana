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

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("StudyTaskBoard", () => {
  it("renders stable SSR placeholders and formats dates in the browser after hydration", () => {
    const element = (
      <StudyTaskBoard
        tasks={[task]}
        onCreate={vi.fn()}
        onComplete={vi.fn()}
      />
    );
    // A server in UTC and a browser in another time zone must produce the
    // same first-hydration markup. Browser-local dates are shown afterwards.
    const html = renderToString(element);
    expect(html).toContain("Carregando horário local…");
    const expected = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(task.dueAt!));
    render(element);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it.each([
    ["2026-10-17T13:45:00", "utc", "2026-10-17T13:45:00Z"],
    ["2026-10-17T13:45:00Z", "UTC", "2026-10-17T13:45:00Z"],
    ["2026-10-17T13:45:00-03:00", "UTC", "2026-10-17T16:45:00Z"],
    ["2026-10-17T13:45:00+02:00", "UTC", "2026-10-17T11:45:00Z"],
  ])("formats Outlook time %s (%s) in a non-UTC browser zone", (dateTime, timeZone, instant) => {
    const DateTimeFormat = Intl.DateTimeFormat;
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function (locales, options) {
      return new DateTimeFormat(locales, { ...options, timeZone: "America/Sao_Paulo" });
    });
    render(<StudyTaskBoard tasks={[]} outlookConnected outlookEvents={[{
      id: "event-offset", subject: "Evento externo",
      start: { dateTime, timeZone }, end: { dateTime, timeZone },
    }]} onCreate={vi.fn()} onComplete={vi.fn()} />);
    const expected = new DateTimeFormat("pt-BR", {
      dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo",
    }).format(new Date(instant));
    expect(screen.getByText(`${expected} · até ${expected}`)).toBeInTheDocument();
  });

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


  it("prevents duplicate creation when the same task form is submitted twice while pending", async () => {
    let finish!: (value: StudyTask) => void;
    const onCreate = vi.fn(() => new Promise<StudyTask>((resolve) => {
      finish = resolve;
    }));
    render(
      <StudyTaskBoard
        tasks={[]}
        onCreate={onCreate}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tarefa"), {
      target: { value: "Nova revisão" },
    });
    const form = screen.getByRole("form", { name: "Adicionar tarefa de estudo" });
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Criando…" })).toBeDisabled();
    finish({ ...task, title: "Nova revisão" });
    expect(await screen.findByText("Nova revisão")).toBeInTheDocument();
    expect(screen.getAllByText("Nova revisão")).toHaveLength(1);
  });

  it("allows retry after an unsuccessful creation and does not create duplicate rows", async () => {
    const onCreate = vi.fn()
      .mockRejectedValueOnce(new Error("synthetic unavailable"))
      .mockResolvedValueOnce({ ...task, title: "Sessão recuperada" });
    render(
      <StudyTaskBoard
        tasks={[]}
        onCreate={onCreate}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );
    fireEvent.change(screen.getByLabelText("Tarefa"), {
      target: { value: "Sessão recuperada" },
    });
    const form = screen.getByRole("form", { name: "Adicionar tarefa de estudo" });
    fireEvent.submit(form);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível criar a tarefa.");
    expect(screen.getByRole("button", { name: "Criar tarefa" })).toBeEnabled();
    fireEvent.submit(form);
    expect(await screen.findByText("Sessão recuperada")).toBeInTheDocument();
    expect(onCreate).toHaveBeenCalledTimes(2);
  });

  it("permits a different task after an earlier creation succeeds", async () => {
    const onCreate = vi.fn()
      .mockResolvedValueOnce({ ...task, title: "Primeira revisão" })
      .mockResolvedValueOnce({ ...task, id: "task-2", title: "Segunda revisão" });
    render(
      <StudyTaskBoard
        tasks={[]}
        onCreate={onCreate}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );
    const form = screen.getByRole("form", { name: "Adicionar tarefa de estudo" });
    fireEvent.change(screen.getByLabelText("Tarefa"), {
      target: { value: "Primeira revisão" },
    });
    fireEvent.submit(form);
    expect(await screen.findByText("Primeira revisão")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Tarefa"), {
      target: { value: "Segunda revisão" },
    });
    fireEvent.submit(form);
    expect(await screen.findByText("Segunda revisão")).toBeInTheDocument();
    expect(onCreate).toHaveBeenCalledTimes(2);
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

    expect(screen.getByText("Nenhuma tarefa pendente.")).toBeInTheDocument();
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
    expect(screen.getByText("Nenhuma tarefa pendente.")).toBeInTheDocument();
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

  it("prevents repeated Outlook scheduling while a task request is pending", async () => {
    let resolveSchedule!: (event: { webLink?: string | null }) => void;
    const onScheduleInOutlook = vi.fn(() => new Promise<{ webLink?: string | null }>((resolve) => {
      resolveSchedule = resolve;
    }));
    render(
      <StudyTaskBoard
        tasks={[task]}
        outlookConnected
        onCreate={vi.fn()}
        onComplete={vi.fn()}
        onScheduleInOutlook={onScheduleInOutlook}
      />,
    );
    const button = screen.getByRole("button", { name: "Agendar no Outlook" });
    fireEvent.click(button);
    fireEvent.click(screen.getByRole("button", { name: "Agendando…" }));
    expect(onScheduleInOutlook).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Agendando…" })).toBeDisabled();

    resolveSchedule({ webLink: null });
    expect(await screen.findByRole("button", { name: "Agendado no Outlook" })).toBeDisabled();
    expect(onScheduleInOutlook).toHaveBeenCalledTimes(1);
  });

  it("keeps separate Outlook tasks independently schedulable while requests are pending", async () => {
    const pending = new Map<string, (event: { webLink?: string | null }) => void>();
    const onScheduleInOutlook = vi.fn((id: string) =>
      new Promise<{ webLink?: string | null }>((resolve) => {
        pending.set(id, resolve);
      }),
    );
    render(
      <StudyTaskBoard
        tasks={[task, { ...task, id: "task-2", title: "Preparar lição" }]}
        outlookConnected
        onCreate={vi.fn()}
        onComplete={vi.fn()}
        onScheduleInOutlook={onScheduleInOutlook}
      />,
    );
    const first = within(screen.getByText("Revisar capítulo").closest("li")!);
    const second = within(screen.getByText("Preparar lição").closest("li")!);
    fireEvent.click(first.getByRole("button", { name: "Agendar no Outlook" }));
    fireEvent.click(second.getByRole("button", { name: "Agendar no Outlook" }));
    expect(onScheduleInOutlook).toHaveBeenCalledTimes(2);
    expect(first.getByRole("button", { name: "Agendando…" })).toBeDisabled();
    expect(second.getByRole("button", { name: "Agendando…" })).toBeDisabled();
    pending.get("task-2")!({ webLink: null });
    await waitFor(() => expect(second.getByRole("button", { name: "Agendado no Outlook" })).toBeDisabled());
    expect(first.getByRole("button", { name: "Agendando…" })).toBeDisabled();
    pending.get("task-1")!({ webLink: null });
    await waitFor(() => expect(first.getByRole("button", { name: "Agendado no Outlook" })).toBeDisabled());
  });

  it("unlocks Outlook scheduling after a failed request and permits retry", async () => {
    let rejectSchedule!: (error: Error) => void;
    const onScheduleInOutlook = vi.fn()
      .mockImplementationOnce(() => new Promise<{ webLink?: string | null }>((_, reject) => {
        rejectSchedule = reject;
      }))
      .mockResolvedValueOnce({ webLink: null });
    render(
      <StudyTaskBoard
        tasks={[task]}
        outlookConnected
        onCreate={vi.fn()}
        onComplete={vi.fn()}
        onScheduleInOutlook={onScheduleInOutlook}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Agendar no Outlook" }));
    expect(screen.getByRole("button", { name: "Agendando…" })).toBeDisabled();
    rejectSchedule(new Error("synthetic Outlook timeout"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Agendar no Outlook" })).toBeEnabled());
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível criar o evento no Outlook.");
    fireEvent.click(screen.getByRole("button", { name: "Agendar no Outlook" }));
    expect(await screen.findByRole("button", { name: "Agendado no Outlook" })).toBeDisabled();
    expect(onScheduleInOutlook).toHaveBeenCalledTimes(2);
  });

  it("shows tasks received after a server-side refresh without remounting the board", async () => {
    const second = { ...task, id: "task-2", title: "Revisar feitiços" };
    const onCreate = vi.fn();
    const onComplete = vi.fn();
    const { rerender } = render(
      <StudyTaskBoard tasks={[task]} onCreate={onCreate} onComplete={onComplete} />,
    );
    expect(screen.queryByText("Revisar feitiços")).not.toBeInTheDocument();
    rerender(
      <StudyTaskBoard tasks={[task, second]} onCreate={onCreate} onComplete={onComplete} />,
    );
    expect(await screen.findByText("Revisar feitiços")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tarefas futuras" }).parentElement?.parentElement).toHaveTextContent("2");
  });

  it("updates details and removes tasks omitted by a newer server snapshot", async () => {
    const second = { ...task, id: "task-2", title: "Revisar poções" };
    const updated = { ...task, title: "Revisar capítulo revisado" };
    const onCreate = vi.fn();
    const onComplete = vi.fn();
    const { rerender } = render(
      <StudyTaskBoard tasks={[task, second]} onCreate={onCreate} onComplete={onComplete} />,
    );
    rerender(
      <StudyTaskBoard tasks={[updated]} onCreate={onCreate} onComplete={onComplete} />,
    );
    expect(await screen.findByText("Revisar capítulo revisado")).toBeInTheDocument();
    expect(screen.queryByText("Revisar capítulo")).not.toBeInTheDocument();
    expect(screen.queryByText("Revisar poções")).not.toBeInTheDocument();
  });

  it("preserves a locally confirmed creation when a stale server snapshot arrives", async () => {
    const created = { ...task, id: "task-local", title: "Estudar glifos" };
    const onCreate = vi.fn().mockResolvedValue(created);
    const onComplete = vi.fn();
    const { rerender } = render(
      <StudyTaskBoard tasks={[task]} onCreate={onCreate} onComplete={onComplete} />,
    );
    fireEvent.change(screen.getByLabelText("Tarefa"), { target: { value: "Estudar glifos" } });
    fireEvent.submit(screen.getByRole("form", { name: "Adicionar tarefa de estudo" }));
    expect(await screen.findByText("Estudar glifos")).toBeInTheDocument();

    rerender(
      <StudyTaskBoard tasks={[{ ...task }]} onCreate={onCreate} onComplete={onComplete} />,
    );
    expect(screen.getByText("Estudar glifos")).toBeInTheDocument();
    rerender(
      <StudyTaskBoard tasks={[{ ...task }, created]} onCreate={onCreate} onComplete={onComplete} />,
    );
    await waitFor(() => expect(screen.getAllByText("Estudar glifos")).toHaveLength(1));
  });

  it("does not resurrect a locally completed task when the server refresh is stale", async () => {
    const onComplete = vi.fn().mockResolvedValue({ ...task, status: "completed" });
    const onCreate = vi.fn();
    const { rerender } = render(
      <StudyTaskBoard tasks={[task]} onCreate={onCreate} onComplete={onComplete} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(screen.queryByText("Revisar capítulo")).not.toBeInTheDocument());
    rerender(
      <StudyTaskBoard tasks={[{ ...task }]} onCreate={onCreate} onComplete={onComplete} />,
    );
    expect(screen.queryByText("Revisar capítulo")).not.toBeInTheDocument();
    rerender(
      <StudyTaskBoard tasks={[]} onCreate={onCreate} onComplete={onComplete} />,
    );
    expect(await screen.findByText("Nenhuma tarefa futura cadastrada.")).toBeInTheDocument();
  });

  it("keeps the Cronograma available if an Outlook event has an invalid date", () => {
    const events = [
      {
        id: "malformed-event",
        subject: "Sessão do grimório",
        start: { dateTime: "invalid-graph-date", timeZone: "UTC" },
        end: { dateTime: "2026-10-20T15:00:00Z", timeZone: "UTC" },
        webLink: "https://outlook.office.com/calendar/item/malformed-event",
      },
    ];
    render(
      <StudyTaskBoard
        tasks={[task]}
        outlookConnected
        outlookEvents={events}
        onCreate={vi.fn()}
        onComplete={vi.fn()}
      />,
    );
    expect(screen.getByText("Sessão do grimório")).toBeInTheDocument();
    expect(screen.getByText("Revisar capítulo")).toBeInTheDocument();
    expect(screen.getByText(/Data indisponível/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not throw if a study task has a malformed due date", () => {
    render(
      <StudyTaskBoard
        tasks={[{ ...task, dueAt: "not-a-valid-date" }]}
        onCreate={vi.fn()}
        onComplete={vi.fn()}
      />,
    );
    expect(screen.getByText("Revisar capítulo")).toBeInTheDocument();
    expect(screen.getByText("Data indisponível")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Concluir" })).toBeEnabled();
  });

  it("treats UTC Outlook event timestamps without offsets as UTC", () => {
    const start = "2026-10-20T13:30:00";
    const end = "2026-10-20T14:30:00";
    const toLocalLabel = (value: string) =>
      new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" })
        .format(new Date(value));
    render(
      <StudyTaskBoard
        tasks={[task]}
        outlookConnected
        outlookEvents={[{
          id: "utc-event",
          subject: "Aula arcana",
          start: { dateTime: start, timeZone: "UTC" },
          end: { dateTime: end, timeZone: "UTC" },
        }]}
        onCreate={vi.fn()}
        onComplete={vi.fn()}
      />,
    );
    const eventItem = screen.getByText("Aula arcana").closest("li");
    expect(eventItem).toHaveTextContent(toLocalLabel(`${start}Z`));
    expect(eventItem).toHaveTextContent(toLocalLabel(`${end}Z`));
  });

});
