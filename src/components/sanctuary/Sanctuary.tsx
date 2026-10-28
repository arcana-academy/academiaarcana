import Link from "next/link";
import { BookOpen, CalendarDays, GraduationCap, Target } from "lucide-react";
import type { SanctuaryViewModel } from "@/domains/sanctuary";
import { SanctuaryContinueLearning } from "./SanctuaryContinueLearning";
import { SanctuaryHeader } from "./SanctuaryHeader";
import { SanctuaryMissions } from "./SanctuaryMissions";
import { SanctuaryProgress } from "./SanctuaryProgress";
import { SanctuarySchedule } from "./SanctuarySchedule";
import { RelewiseSearch } from "@/components/search/RelewiseSearch";
import { MestreArcanoPanel } from "./MestreArcanoPanel";

type SanctuaryProps = {
  viewModel: SanctuaryViewModel;
};

const sanctuaryShortcuts = [
  { href: "/grimorios", title: "Meus grimórios", detail: "Sua biblioteca pessoal", icon: BookOpen },
  { href: "/academia", title: "Academia", detail: "Aprenda qualquer assunto", icon: GraduationCap },
  { href: "/missoes", title: "Missões", detail: "Acompanhe seus objetivos", icon: Target },
  { href: "/cronograma", title: "Cronograma", detail: "Organize sua jornada", icon: CalendarDays },
] as const;

export function Sanctuary({ viewModel }: SanctuaryProps) {
  const learningHeading =
    viewModel.continueLearning.status === "ready"
      ? viewModel.continueLearning.data.intent === "resume"
        ? "Continue aprendendo"
        : "Explore seu próximo estudo"
      : viewModel.continueLearning.status === "empty"
        ? "Comece pelo seu conteúdo"
        : "Contexto de aprendizagem";

  return (
    <main className="aa-page aa-sanctuary" aria-labelledby="sanctuary-title">
      <SanctuaryHeader
        header={viewModel.header}
        primaryAction={viewModel.primaryAction}
      />

      <RelewiseSearch />

      <section className="aa-sanctuary-command" aria-label="Próximo passo de aprendizagem">
        <div className="aa-sanctuary-command-primary">
          <p className="aa-eyebrow">Próximo passo</p>
          <h2>{learningHeading}</h2>
          <SanctuaryContinueLearning continueLearning={viewModel.continueLearning} />
        </div>

        <div className="aa-sanctuary-command-secondary">
          <p className="aa-eyebrow">Visão geral</p>
          <h2>Seu progresso</h2>
          <SanctuaryProgress progress={viewModel.progress} />
        </div>
      </section>

      <section className="aa-sanctuary-shortcuts" aria-labelledby="sanctuary-shortcuts-title">
        <div className="aa-sanctuary-shortcuts-header">
          <div>
            <p className="aa-eyebrow">Sua biblioteca e rotina</p>
            <h2 id="sanctuary-shortcuts-title">Explore seus espaços de estudo</h2>
          </div>
        </div>
        <div className="aa-sanctuary-shortcuts-grid">
          {sanctuaryShortcuts.map(({ href, title, detail, icon: Icon }) => (
            <Link className="aa-sanctuary-shortcut" href={href} key={href}>
              <Icon size={24} aria-hidden="true" />
              <strong>{title}</strong>
              <span>{detail}</span>
              <span className="aa-sanctuary-shortcut-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="aa-surface aa-sanctuary-section" aria-labelledby="adaptive-recommendation-title">
        <p className="aa-eyebrow">Sugestão para seu próximo estudo</p>
        <h2 id="adaptive-recommendation-title">{viewModel.adaptiveRecommendation.title}</h2>
        <p>{viewModel.adaptiveRecommendation.message}</p>
        <p className="aa-state-copy">{viewModel.adaptiveRecommendation.reason}</p>
        <Link className="aa-button aa-button-secondary aa-button-sm" href={viewModel.adaptiveRecommendation.href}>
          Seguir recomendação
        </Link>
      </section>

      <MestreArcanoPanel />

      <div className="aa-sanctuary-grid">
        <SanctuaryMissions missions={viewModel.missions} />
        <SanctuarySchedule schedule={viewModel.schedule} />
      </div>
    </main>
  );
}
