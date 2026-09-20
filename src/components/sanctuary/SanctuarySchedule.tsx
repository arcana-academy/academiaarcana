import type { SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryScheduleProps = {
    schedule: SanctuaryViewModel["schedule"];
};

/**
 * Presentational Schedule section for the Sanctuary.
 *
 * Renders `SectionState<ScheduleItem[]>` explicitly without fabricating,
 * recalculating, or persisting schedule data. The `ready` state renders only
 * the provided items (time, title and location when present); the other
 * states render explicit messages. There are no interactive elements
 * because the contract provides no schedule action.
 */
export function SanctuarySchedule({ schedule }: SanctuaryScheduleProps) {
    return (
        <section aria-labelledby="sanctuary-schedule">
            <h2 id="sanctuary-schedule">Agenda</h2>

            {schedule.status === "ready" ? (
                <ul>
                    {schedule.data.map((item) => (
                        <li key={item.id}>
                            <p>{item.time}</p>
                            <p>{item.title}</p>
                            {item.location ? (
                                <p>{item.location}</p>
                            ) : null}
                        </li>
                    ))}
                </ul>
            ) : null}

            {schedule.status === "empty" ? (
                <p>Ainda não há itens na agenda.</p>
            ) : null}

            {schedule.status === "not-configured" ? (
                <p>
                    O recurso de agenda ainda não está configurado e não há
                    itens disponíveis.
                </p>
            ) : null}

            {schedule.status === "error" ? (
                <p>
                    Não foi possível carregar a agenda agora. Tente novamente
                    mais tarde.
                </p>
            ) : null}
        </section>
    );
}
