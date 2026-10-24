// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

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
    ["2026-10-17T13:45:00", "utc"],
    ["2026-10-17T13:45:00.0000000", "UTC"],
    ["2026-10-17T13:45:00Z", "UTC"],
    ["2026-10-17T10:45:00-03:00", "UTC"],
    ["2026-10-17T15:45:00+02:00", "Europe/Paris"],
  ])("renders equivalent Outlook timestamp %s (%s) as the same instant", (dateTime, timeZone) => {
    render(<StudyTaskBoard tasks={[]} outlookConnected onCreate={vi.fn()} onComplete={vi.fn()}
      outlookEvents={[{
        id: "equivalent-event", subject: "Revisão externa",
        start: { dateTime, timeZone },
        end: { dateTime: "2026-10-17T14:45:00Z", timeZone: "UTC" },
      }]} />);
    const events = within(screen.getByRole("region", { name: "Eventos do Outlook" }));
    const formatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" });
    expect(events.getByText(`${formatter.format(new Date("2026-10-17T13:45:00Z"))} · até ${formatter.format(new Date("2026-10-17T14:45:00Z"))}`))
      .toBeInTheDocument();
  });

  it("replaces an Outlook outage with recovered events on the next server snapshot", () => {
    const props = { tasks: [task], outlookConnected: true, onCreate: vi.fn(), onComplete: vi.fn() };
    const events = [{
      id: "recovered-event", subject: "Revisão recuperada",
      start: { dateTime: "2026-10-17T13:45:00Z", timeZone: "UTC" },
      end: { dateTime: "2026-10-17T14:45:00Z", timeZone: "UTC" },
    }];
    const { rerender } = render(<StudyTaskBoard {...props} outlookEventsUnavailable outlookEvents={events} />);
    expect(screen.getByRole("status")).toHaveTextContent("Não foi possível carregar");
    expect(screen.queryByText("Revisão recuperada")).not.toBeInTheDocument();
    rerender(<StudyTaskBoard {...props} outlookEventsUnavailable={false} outlookEvents={events} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Revisão recuperada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Concluir" })).toBeEnabled();
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

  it("previews the selected deadline in Brazilian notation without changing the saved instant", async () => {
    const localValue = "2028-02-29T09:05";
    const created = { ...task, id: "task-local-date", dueAt: new Date(localValue).toISOString() };
    const onCreate = vi.fn().mockResolvedValue(created);

    render(
      <StudyTaskBoard
        tasks={[]}
        onCreate={onCreate}
        onComplete={vi.fn()}
      />,
    );

    const deadline = screen.getByLabelText("Prazo");
    expect(deadline).toHaveAttribute("type", "datetime-local");
    expect(deadline).toHaveAttribute("aria-describedby", "study-task-due-preview");
    expect(screen.getByText("Formato brasileiro: DD/MM/AAAA às HH:MM.")).toBeInTheDocument();

    fireEvent.change(deadline, { target: { value: localValue } });
    expect(screen.getByText("Prazo selecionado: 29/02/2028 às 09:05.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tarefa"), { target: { value: "Revisar grimório" } });
    fireEvent.submit(screen.getByRole("form", { name: "Adicionar tarefa de estudo" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({
      title: "Revisar grimório",
      dueAt: new Date(localValue).toISOString(),
    }));
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
  it("labels overdue, future and unscheduled items together as pending tasks", () => {
    render(
      <StudyTaskBoard
        tasks={[
          { ...task, id: "overdue", title: "Revisão vencida", dueAt: "2020-01-01T10:00:00.000Z" },
          { ...task, id: "future", title: "Revisão futura", dueAt: "2030-01-01T10:00:00.000Z" },
          { ...task, id: "unscheduled", title: "Revisão sem prazo", dueAt: null },
        ]}
        onCreate={vi.fn()}
        onComplete={vi.fn()}
      />,
    );

    const pending = screen.getByRole("region", { name: "Tarefas pendentes" });
    expect(pending).toContainElement(screen.getByText("Revisão vencida"));
    expect(pending).toContainElement(screen.getByText("Revisão futura"));
    expect(pending).toContainElement(screen.getByText("Revisão sem prazo"));
    expect(pending).toContainElement(screen.getByText("Sem prazo"));
    expect(screen.queryByRole("heading", { name: "Tarefas futuras" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Concluir" })).toHaveLength(3);
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

  it("keeps study tasks usable when an Outlook event contains an invalid date", async () => {
    render(
      <StudyTaskBoard
        tasks={[task]}
        outlookConnected
        outlookEvents={[{
          id: "event-invalid",
          subject: "Reunião externa",
          start: { dateTime: "invalid-date", timeZone: "UTC" },
          end: { dateTime: "2026-10-17T18:00:00", timeZone: "UTC" },
        }]}
        onCreate={vi.fn()}
        onComplete={vi.fn().mockResolvedValue({ ...task, status: "completed" })}
      />,
    );

    expect(screen.getByText("Data indisponível", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Revisar capítulo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(screen.queryByText("Revisar capítulo")).not.toBeInTheDocument());
  });

  it("renders a malformed task deadline without hiding its completion action", async () => {
    render(
      <StudyTaskBoard
        tasks={[{ ...task, dueAt: "invalid-date" }]}
        onCreate={vi.fn()}
        onComplete={vi.fn().mockResolvedValue({ ...task, status: "completed" })}
      />,
    );

    expect(screen.getByText("Data indisponível")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Concluir" })).toBeEnabled();
  });

  it("treats an offset-free UTC Outlook event as UTC, not as browser-local time", () => {
    const value = "2026-10-17T13:45:00";
    const { container } = render(
      <StudyTaskBoard
        tasks={[]}
        outlookConnected
        outlookEvents={[{
          id: "event-utc",
          subject: "Revisão externa",
          start: { dateTime: value, timeZone: "UTC" },
          end: { dateTime: "2026-10-17T14:45:00", timeZone: "UTC" },
        }]}
        onCreate={vi.fn()}
        onComplete={vi.fn()}
      />,
    );
    const expected = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value + "Z"));
    expect(container.textContent).toContain(expected);
  });
  it("keeps study tasks accessible when Outlook omits an event timezone", () => {
    render(
      <StudyTaskBoard
        tasks={[task]}
        outlookConnected
        outlookEvents={[{
          id: "event-without-timezone",
          subject: "Revisão externa",
          start: { dateTime: "2026-10-17T13:45:00", timeZone: null },
          end: { dateTime: "2026-10-17T14:45:00", timeZone: "UTC" },
        }]}
        onCreate={vi.fn()}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );
    expect(screen.getByText(/Data indisponível/)).toBeInTheDocument();
    expect(screen.getByText("Revisar capítulo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Concluir" })).toBeEnabled();
  });

  it("shows an Outlook connection outage without hiding native study tasks", () => {
    render(
      <StudyTaskBoard
        tasks={[task]}
        outlookEventsUnavailable
        onCreate={vi.fn()}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Não foi possível verificar a conexão do Outlook agora.",
    );
    expect(screen.getByText("Revisar capítulo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Concluir" })).toBeEnabled();
  });

  it("distinguishes unavailable Outlook events from an empty calendar without hiding tasks", () => {
    render(
      <StudyTaskBoard
        tasks={[task]}
        outlookConnected
        outlookEventsUnavailable
        outlookEvents={[]}
        onCreate={vi.fn()}
        onComplete={vi.fn().mockResolvedValue(task)}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Não foi possível carregar os eventos do Outlook agora.",
    );
    expect(screen.queryByText("Nenhum evento encontrado no Outlook neste período.")).not.toBeInTheDocument();
    expect(screen.getByText("Revisar capítulo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Concluir" })).toBeEnabled();
  });

});
