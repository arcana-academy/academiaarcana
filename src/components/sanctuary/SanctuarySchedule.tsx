import { CalendarDays } from "lucide-react";
import type { SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryScheduleProps = {
  schedule: SanctuaryViewModel["schedule"];
};

export function SanctuarySchedule({ schedule }: SanctuaryScheduleProps) {
  return (
    <section
      className="aa-card aa-card-default aa-sanctuary-section"
      aria-labelledby="sanctuary-schedule"
    >
      <header>
        <p className="aa-eyebrow">Planejamento</p>
        <h2 id="sanctuary-schedule">Agenda</h2>
        <p>Próximos compromissos de aprendizagem disponíveis.</p>
      </header>

      {schedule.status === "ready" ? (
        <ul className="aa-data-list">
          {schedule.data.map((item) => (
            <li className="aa-data-item" key={item.id}>
              <div>
                <p className="aa-data-item-title">
                  <time>{item.time}</time><span aria-hidden="true"> · </span><span>{item.title}</span>
                </p>
                {item.location ? (
                  <p className="aa-data-item-meta">{item.location}</p>
                ) : null}
              </div>
              <CalendarDays size={18} aria-hidden="true" />
            </li>
          ))}
        </ul>
      ) : null}

      {schedule.status === "empty" ? (
        <div className="aa-state-card">
          <p>Ainda não há itens na agenda.</p>
        </div>
      ) : null}

      {schedule.status === "not-configured" ? (
        <div className="aa-state-card" data-state="warning">
          <p>O recurso de agenda ainda não está configurado e não há itens disponíveis.</p>
        </div>
      ) : null}

      {schedule.status === "error" ? (
        <div className="aa-state-card" data-state="error" role="alert">
          <p>Não foi possível carregar a agenda agora. Tente novamente mais tarde.</p>
        </div>
      ) : null}
    </section>
  );
}
