import Link from "next/link";
import { OutlookCalendarClient } from "@/infrastructure/integrations/outlook-calendar";
import {
  getOutlookAccessToken,
  isOutlookCalendarConnected,
} from "@/infrastructure/integrations/outlook-calendar-session";
import { SupabaseStudyTaskRepository } from "@/infrastructure/supabase/planning/study-task-repository";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { StudyTaskBoard } from "@/components/planning/StudyTaskBoard";

import {
  completeStudyTaskAction,
  createStudyTask,
} from "./actions";
import { createOutlookEventForTask } from "./outlook-actions";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/cronograma");

export default async function CronogramaPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabaseStudyTaskRepository(supabase);

  let tasks: Awaited<ReturnType<SupabaseStudyTaskRepository["listUpcoming"]>>;
  try {
    tasks = await repository.listUpcoming(
      claims.sub,
      new Date().toISOString(),
    );
  } catch {
    return (
      <AuthenticatedShell currentPath="/cronograma">
        <main className="aa-page aa-page-narrow" aria-labelledby="cronograma-title">
          <header className="aa-page-header">
            <div className="aa-page-header-copy">
              <p className="aa-eyebrow">Planejamento · ritmo</p>
              <h1 id="cronograma-title">Cronograma</h1>
              <p>Transforme intenção em próximos passos claros, sem sobrecarregar sua visão.</p>
            </div>
          </header>

          <section
            className="aa-surface aa-sanctuary-section"
            role="alert"
            aria-labelledby="cronograma-load-error-title"
          >
            <h2 id="cronograma-load-error-title">Não foi possível carregar as tarefas do Cronograma</h2>
            <p>As tarefas não foram atualizadas. Tente novamente para consultar seu planejamento.</p>
            <form action="/cronograma" method="get">
              <button className="aa-button aa-button-secondary" type="submit">
                Tentar novamente
              </button>
            </form>
          </section>
          <p className="aa-card-actions">
            <Link className="aa-button aa-button-ghost" href="/academia">
              Voltar à Academia
            </Link>
          </p>
        </main>
      </AuthenticatedShell>
    );
  }

  const outlookConnected = await isOutlookCalendarConnected();
  let outlookEventsUnavailable = false;
  let outlookEvents: Awaited<
    ReturnType<OutlookCalendarClient["listEvents"]>
  > = [];

  if (outlookConnected) {
    try {
      const accessToken = await getOutlookAccessToken({ refresh: true });
      if (accessToken) {
        const start = new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        outlookEvents = await new OutlookCalendarClient(accessToken).listEvents(
          start.toISOString(),
          end.toISOString(),
        );
      } else {
        // A connection may disappear between the status check and token lookup.
        // No token means no calendar query occurred, not an empty calendar.
        outlookEventsUnavailable = true;
      }
    } catch {
      outlookEventsUnavailable = true;
      outlookEvents = [];
    }
  }

  return (
    <AuthenticatedShell currentPath="/cronograma">
      <StudyTaskBoard
        tasks={tasks}
        outlookConnected={outlookConnected}
        outlookEvents={outlookEvents}
        outlookEventsUnavailable={outlookEventsUnavailable}
        onCreate={createStudyTask}
        onComplete={completeStudyTaskAction}
        onScheduleInOutlook={createOutlookEventForTask}
      />
    </AuthenticatedShell>
  );
}
