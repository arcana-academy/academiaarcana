import type { SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryMissionsProps = {
  missions: SanctuaryViewModel["missions"];
};

export function SanctuaryMissions({ missions }: SanctuaryMissionsProps) {
  return (
    <section className="aa-sanctuary-panel" aria-labelledby="sanctuary-missions">
      <div className="aa-section-heading">
        <div>
          <span className="aa-section-kicker">Próximos desafios</span>
          <h2 id="sanctuary-missions">Missões</h2>
        </div>
      </div>

      {missions.status === "ready" ? (
        <ul className="aa-data-list">
          {missions.data.map((mission) => (
            <li key={mission.id} className="aa-data-row">
              <span className="aa-data-icon" aria-hidden="true">◆</span>
              <div><p>{mission.title}</p><span>{mission.reward}</span></div>
              <span className="aa-row-status">{mission.isCompleted ? "Concluída" : "Em aberto"}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {missions.status === "empty" ? <p className="aa-state-message">Ainda não há missões disponíveis.</p> : null}
      {missions.status === "not-configured" ? <p className="aa-state-message">O recurso de missões ainda não está configurado e não há missões disponíveis.</p> : null}
      {missions.status === "error" ? <p className="aa-state-message aa-state-danger">Não foi possível carregar as missões agora. Tente novamente mais tarde.</p> : null}
    </section>
  );
}
