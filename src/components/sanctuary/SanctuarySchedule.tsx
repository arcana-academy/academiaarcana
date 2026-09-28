import type { SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryScheduleProps = {
  schedule: SanctuaryViewModel["schedule"];
};

export function SanctuarySchedule({ schedule }: SanctuaryScheduleProps) {
  return (
    <section className="aa-sanctuary-panel" aria-labelledby="sanctuary-schedule">
      <div className="aa-section-heading">
        <div>
          <span className="aa-section-kicker">Planejamento</span>
          <h2 id="sanctuary-schedule">Agenda</h2>
        </div>
      </div>

      {schedule.status === "ready" ? (
        <ul className="aa-data-list">
          {schedule.data.map((item) => (
            <li key={item.id} className="aa-data-row">
              <span className="aa-data-time">{item.time}</span>
              <div><p>{item.title}</p>{item.location ? <span>{item.location}</span> : null}</div>
            </li>
          ))}
        </ul>
      ) : null}
      {schedule.status === "empty" ? <p className="aa-state-message">Ainda não há itens na agenda.</p> : null}
      {schedule.status === "not-configured" ? <p className="aa-state-message">O recurso de agenda ainda não está configurado e não há itens disponíveis.</p> : null}
      {schedule.status === "error" ? <p className="aa-state-message aa-state-danger">Não foi possível carregar a agenda agora. Tente novamente mais tarde.</p> : null}
    </section>
  );
}
