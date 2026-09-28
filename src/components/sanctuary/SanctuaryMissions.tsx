import type { SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryMissionsProps = {
  missions: SanctuaryViewModel["missions"];
};

/** Present the real mission snapshot without fabricating unavailable data. */
export function SanctuaryMissions({ missions }: SanctuaryMissionsProps) {
  return (
    <section
      className="sanctuary-card aa-card aa-card-default"
      aria-labelledby="sanctuary-missions"
    >
      <header className="aa-page-header">
        <p className="aa-eyebrow">Gamificação</p>
        <h2 id="sanctuary-missions">Missões</h2>
      </header>

      {missions.status === "ready" ? (
        <ul className="aa-card-grid aa-list-reset">
          {missions.data.map((mission) => (
            <li className="aa-card aa-card-inset sanctuary-mission-card" key={mission.id}>
              <div className="aa-card-heading-row">
                <h3>{mission.title}</h3>
                <span className="aa-badge aa-badge-neutral">{mission.reward}</span>
              </div>
              <p>
                {mission.isCompleted ? "Concluída" : "Em aberto"}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {missions.status === "empty" ? (
        <p className="aa-empty-state">Ainda não há missões disponíveis.</p>
      ) : null}

      {missions.status === "not-configured" ? (
        <p className="aa-empty-state">
          O recurso de missões ainda não está configurado e não há missões
          disponíveis.
        </p>
      ) : null}

      {missions.status === "error" ? (
        <div className="aa-alert aa-alert-danger" role="alert">
          <p>
            Não foi possível carregar as missões agora. Tente novamente mais
            tarde.
          </p>
        </div>
      ) : null}
    </section>
  );
}
