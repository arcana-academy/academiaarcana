import type { SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryMissionsProps = {
  missions: SanctuaryViewModel["missions"];
};

export function SanctuaryMissions({ missions }: SanctuaryMissionsProps) {
  return (
    <section className="aa-surface aa-sanctuary-section" aria-labelledby="sanctuary-missions">
      <div className="aa-surface-header">
        <div>
          <p className="aa-eyebrow">Ação</p>
          <h2 id="sanctuary-missions">Missões</h2>
        </div>
      </div>

      {missions.status === "ready" ? (
        <ul className="aa-list">
          {missions.data.map((mission) => (
            <li className="aa-list-item" key={mission.id}>
              <div>
                <strong>{mission.title}</strong>
                <small>{mission.reward}</small>
              </div>
              <span className="aa-status">
                {mission.isCompleted ? "Concluída" : "Em aberto"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {missions.status === "empty" ? <div className="aa-empty"><p>Ainda não há missões disponíveis.</p></div> : null}
      {missions.status === "not-configured" ? <div className="aa-empty"><p>O recurso de missões ainda não está configurado.</p></div> : null}
      {missions.status === "error" ? <div className="aa-empty"><p>Não foi possível carregar as missões agora.</p></div> : null}
    </section>
  );
}
