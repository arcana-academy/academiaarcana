import type { SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryMissionsProps = {
    missions: SanctuaryViewModel["missions"];
};

/**
 * Presentational Missions section for the Sanctuary.
 *
 * Renders `SectionState<SanctuaryMission[]>` explicitly without fabricating,
 * recalculating, or persisting mission data. The `ready` state renders only
 * the provided missions (title, reward and completion flag); the other
 * states render explicit messages. There are no interactive elements
 * because the contract provides no mission action.
 */
export function SanctuaryMissions({ missions }: SanctuaryMissionsProps) {
    return (
        <section aria-labelledby="sanctuary-missions">
            <h2 id="sanctuary-missions">Missões</h2>

            {missions.status === "ready" ? (
                <ul>
                    {missions.data.map((mission) => (
                        <li key={mission.id}>
                            <p>{mission.title}</p>
                            <p>{mission.reward}</p>
                            <p>
                                {mission.isCompleted
                                    ? "Concluída"
                                    : "Em aberto"}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : null}

            {missions.status === "empty" ? (
                <p>Ainda não há missões disponíveis.</p>
            ) : null}

            {missions.status === "not-configured" ? (
                <p>
                    O recurso de missões ainda não está configurado e não há
                    missões disponíveis.
                </p>
            ) : null}

            {missions.status === "error" ? (
                <p>
                    Não foi possível carregar as missões agora. Tente novamente
                    mais tarde.
                </p>
            ) : null}
        </section>
    );
}
