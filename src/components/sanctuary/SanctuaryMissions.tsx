import { CheckCircle2, Circle } from "lucide-react";
import type { SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryMissionsProps = {
  missions: SanctuaryViewModel["missions"];
};

export function SanctuaryMissions({ missions }: SanctuaryMissionsProps) {
  return (
    <section
      className="aa-card aa-card-default aa-sanctuary-section"
      aria-labelledby="sanctuary-missions"
    >
      <header>
        <p className="aa-eyebrow">Desafios</p>
        <h2 id="sanctuary-missions">Missões</h2>
        <p>Pequenos objetivos que ajudam a manter a prática.</p>
      </header>

      {missions.status === "ready" ? (
        <ul className="aa-data-list">
          {missions.data.map((mission) => (
            <li className="aa-data-item" key={mission.id}>
              <div>
                <p className="aa-data-item-title">{mission.title}</p>
                <p className="aa-data-item-meta">{mission.reward}</p>
              </div>
              <span
                className={
                  "aa-data-item-status " +
                  (mission.isCompleted ? "aa-status-success" : "aa-status-info")
                }
              >
                {mission.isCompleted ? (
                  <CheckCircle2 size={17} aria-hidden="true" />
                ) : (
                  <Circle size={17} aria-hidden="true" />
                )}
                {mission.isCompleted ? "Concluída" : "Em aberto"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {missions.status === "empty" ? (
        <div className="aa-state-card">
          <p>Ainda não há missões disponíveis.</p>
        </div>
      ) : null}

      {missions.status === "not-configured" ? (
        <div className="aa-state-card" data-state="warning">
          <p>O recurso de missões ainda não está configurado e não há missões disponíveis.</p>
        </div>
      ) : null}

      {missions.status === "error" ? (
        <div className="aa-state-card" data-state="error" role="alert">
          <p>Não foi possível carregar as missões agora. Tente novamente mais tarde.</p>
        </div>
      ) : null}
    </section>
  );
}
