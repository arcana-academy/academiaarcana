import type { SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryScheduleProps = {
  schedule: SanctuaryViewModel["schedule"];
};

/** Present the real schedule snapshot without fabricating unavailable data. */
export function SanctuarySchedule({ schedule }: SanctuaryScheduleProps) {
  return (
    <section
      className="sanctuary-card aa-card aa-card-default"
      aria-labelledby="sanctuary-schedule"
    >
      <header className="aa-page-header">
        <p className="aa-eyebrow">Planejamento</p>
        <h2 id="sanctuary-schedule">Agenda</h2>
      </header>

      {schedule.status === "ready" ? (
        <ul className="aa-card-grid aa-list-reset">
          {schedule.data.map((item) => (
            <li className="aa-card aa-card-inset sanctuary-schedule-card" key={item.id}>
              <time className="sanctuary-schedule-time">{item.time}</time>
              <h3>{item.title}</h3>
              {item.location ? <p>{item.location}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {schedule.status === "empty" ? (
        <p className="aa-empty-state">Ainda não há itens na agenda.</p>
      ) : null}

      {schedule.status === "not-configured" ? (
        <p className="aa-empty-state">
          O recurso de agenda ainda não está configurado e não há itens
          disponíveis.
        </p>
      ) : null}

      {schedule.status === "error" ? (
        <div className="aa-alert aa-alert-danger" role="alert">
          <p>
            Não foi possível carregar a agenda agora. Tente novamente mais
            tarde.
          </p>
        </div>
      ) : null}
    </section>
  );
}
