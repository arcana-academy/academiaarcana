import type { SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryScheduleProps = {
  schedule: SanctuaryViewModel["schedule"];
};

export function SanctuarySchedule({ schedule }: SanctuaryScheduleProps) {
  return (
    <section className="aa-surface aa-sanctuary-section" aria-labelledby="sanctuary-schedule">
      <div className="aa-surface-header">
        <div>
          <p className="aa-eyebrow">Ritmo</p>
          <h2 id="sanctuary-schedule">Agenda</h2>
        </div>
      </div>

      {schedule.status === "ready" ? (
        <ul className="aa-list">
          {schedule.data.map((item) => (
            <li className="aa-list-item" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                {item.location ? <small>{item.location}</small> : null}
              </div>
              <span className="aa-status">{item.time}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {schedule.status === "empty" ? <div className="aa-empty"><p>Ainda não há itens na agenda.</p></div> : null}
      {schedule.status === "not-configured" ? <div className="aa-empty"><p>O recurso de agenda ainda não está configurado.</p></div> : null}
      {schedule.status === "error" ? <div className="aa-empty"><p>Não foi possível carregar a agenda agora.</p></div> : null}
    </section>
  );
}
