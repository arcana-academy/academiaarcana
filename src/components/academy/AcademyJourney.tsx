import Link from "next/link";

import type { SanctuaryViewModel } from "@/domains/sanctuary";
import { Progress } from "@/components/ui/progress";

export type AcademyJourneyProjection = Pick<
  SanctuaryViewModel,
  "continueLearning" | "progress" | "missions" | "schedule"
>;

type AcademyJourneyProps = {
  journey: AcademyJourneyProjection;
};

/**
 * A single, authenticated read-side path through existing persisted modules.
 * All counts and titles come from Sanctuary projections; no demo data or
 * client-side impersonation of successful writes is introduced.
 */
export function AcademyJourney({ journey }: AcademyJourneyProps) {
  const learning = journey.continueLearning;
  const progress = journey.progress;
  const missions = journey.missions;
  const schedule = journey.schedule;

  const path =
    learning.status === "ready"
      ? [
          learning.data.grimoireTitle,
          learning.data.notebookTitle,
          learning.data.chapterTitle,
          learning.data.pageTitle,
        ].filter((value): value is string => Boolean(value))
      : [];

  const missionSummary =
    missions.status === "ready"
      ? `${missions.data.filter((mission) => mission.isCompleted).length} de ${missions.data.length} missões concluídas hoje`
      : missions.status === "empty"
        ? "Nenhuma missão registrada hoje."
        : missions.status === "error"
          ? "Não foi possível consultar as missões agora."
          : "As missões ainda não estão configuradas.";

  return (
    <section className="academy-paths" aria-labelledby="academy-journey-title">
      <header className="academy-paths-header">
        <p className="aa-eyebrow">Sua jornada · dados reais</p>
        <h2 id="academy-journey-title">Do primeiro grimório à próxima missão</h2>
        <p>
          Um caminho para começar, continuar e reconhecer seu progresso,
          sem exigir uma sequência perfeita de estudos.
        </p>
      </header>

      <div className="academy-path-groups">
        <section className="aa-surface academy-path-group" aria-labelledby="academy-journey-learn-title">
          <header className="academy-path-group-header">
            <p className="aa-eyebrow">Conhecimento</p>
            <h3 id="academy-journey-learn-title">Grimórios, capítulos e páginas</h3>
          </header>

          {learning.status === "ready" ? (
            <>
              <p className="aa-state-copy">Seu caminho de estudo disponível:</p>
              <p>{path.join(" › ")}</p>
              <Link className="aa-button aa-button-primary" href={learning.data.href}>
                {learning.data.intent === "resume" ? "Retomar conteúdo" : "Abrir conteúdo"}
              </Link>
            </>
          ) : learning.status === "empty" ? (
            <>
              <p>Você ainda não tem um conteúdo cadastrado. Comece com seu primeiro grimório.</p>
              <Link className="aa-button aa-button-primary" href="/workspace">
                Criar primeiro grimório
              </Link>
            </>
          ) : (
            <div role={learning.status === "error" ? "alert" : "status"}>
              <p>
                {learning.status === "error"
                  ? "Seu conteúdo está temporariamente indisponível; isso não significa que foi apagado."
                  : "O contexto de aprendizagem ainda não está configurado."}
              </p>
              <Link className="aa-button aa-button-secondary" href="/workspace">
                Abrir Workspace
              </Link>
            </div>
          )}

          <nav aria-label="Explorar materiais de estudo">
            <ul className="academy-path-list">
              <li><Link href="/grimorios">Consultar Grimórios</Link></li>
              <li><Link href="/workspace">Organizar capítulos e páginas</Link></li>
              <li><Link href="/pratica">Praticar o que aprendeu</Link></li>
            </ul>
          </nav>
        </section>

        <section className="aa-surface academy-path-group" aria-labelledby="academy-journey-progress-title">
          <header className="academy-path-group-header">
            <p className="aa-eyebrow">Continuidade</p>
            <h3 id="academy-journey-progress-title">Progresso sem cobrança</h3>
          </header>

          {progress.status === "ready" ? (
            <>
              <p>{progress.data.label}</p>
              <Progress
                value={progress.data.percentage}
                label="Progresso de páginas concluídas"
              />
              <p className="aa-state-copy">{progress.data.percentage}% das páginas concluídas</p>
            </>
          ) : (
            <p role={progress.status === "error" ? "alert" : "status"}>
              {progress.status === "error"
                ? "O progresso está indisponível agora. Seus estudos não foram reiniciados."
                : progress.status === "empty"
                  ? "Quando houver páginas registradas, seu progresso poderá aparecer aqui."
                  : "O acompanhamento de páginas ainda não está configurado."}
            </p>
          )}

          <Link className="aa-button aa-button-secondary" href="/santuario">
            Ir ao Santuário
          </Link>
        </section>

        <section className="aa-surface academy-path-group" aria-labelledby="academy-journey-missions-title">
          <header className="academy-path-group-header">
            <p className="aa-eyebrow">Ação</p>
            <h3 id="academy-journey-missions-title">Missões e próximos passos</h3>
          </header>

          <p role={missions.status === "error" ? "alert" : "status"}>{missionSummary}</p>
          {schedule.status === "ready" ? (
            <p className="aa-state-copy">
              {schedule.data.length} {schedule.data.length === 1 ? "tarefa de estudo disponível" : "tarefas de estudo disponíveis"} no cronograma.
            </p>
          ) : schedule.status === "empty" ? (
            <p className="aa-state-copy">Nenhuma tarefa futura registrada no cronograma.</p>
          ) : schedule.status === "error" ? (
            <p role="alert">Não foi possível consultar seu cronograma agora.</p>
          ) : (
            <p className="aa-state-copy">O cronograma ainda não está configurado.</p>
          )}
          <nav aria-label="Ações da jornada">
            <ul className="academy-path-list">
              <li><Link href="/missoes">Abrir Missões</Link></li>
              <li><Link href="/cronograma">Planejar próximo estudo</Link></li>
            </ul>
          </nav>
        </section>
      </div>
    </section>
  );
}
