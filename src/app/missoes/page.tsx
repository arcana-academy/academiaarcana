import Image from "next/image";
import Link from "next/link";
import { Sparkles, Target } from "lucide-react";

import type { Mission } from "@/domains/gamification";
import { SupabaseGamificationRepository } from "@/infrastructure/supabase/gamification/gamification-repository";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { FeatureCard } from "@/components/ui/feature-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/missoes");

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

const missionDocument = "/assets/missions/aa-mission-document.svg";

export default async function MissoesPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  // A failed read is not an empty day. Preserve the authenticated route and
  // show a retry rather than hiding previously recorded missions.
  let missions: Awaited<ReturnType<SupabaseGamificationRepository["listDailyMissions"]>> = [];
  let loadError = false;
  try {
    missions = await new SupabaseGamificationRepository(supabase).listDailyMissions(
      claims.sub,
      todayUtc(),
    );
  } catch {
    loadError = true;
  }
  const completed = missions.filter((mission) => mission.status === "completed").length;

  return (
    <AuthenticatedShell currentPath="/missoes">
      <ArcanaPage
        eyebrow="Gamificação"
        title="Missões"
        description="Objetivos derivados de eventos reais de estudo, sem pressão artificial ou dados fictícios."
        actions={[{ href: "/cronograma", label: "Abrir cronograma", variant: "secondary" }]}
      >
        {loadError ? (
          <section className="aa-surface aa-sanctuary-section" role="alert" aria-labelledby="missions-error-title">
            <h2 id="missions-error-title">Não foi possível carregar as missões</h2>
            <p>Seu progresso não foi alterado. Tente carregar novamente.</p>
            <form action="/missoes" method="get">
              <button className="aa-button aa-button-secondary" type="submit">
                Tentar novamente
              </button>
            </form>
          </section>
        ) : (
        <ArcanaFeatureGrid>
          <FeatureCard
            title="Hoje"
            description="Missões registradas para o dia atual."
            icon={<Image src={missionDocument} alt="" width={22} height={22} />}
          >
            {loadError ? (
              <div role="alert">
                <p>Não foi possível carregar as missões. Seus registros não foram alterados.</p>
                <form action="/missoes" method="get" className="aa-card-actions">
                  <button className="aa-button aa-button-secondary aa-button-sm" type="submit">
                    Tentar novamente
                  </button>
                </form>
              </div>
            ) : (
              <p className="aa-state-copy" aria-live="polite">
                {missions.length
                  ? `${completed}/${missions.length} concluídas`
                  : "Nenhuma missão registrada hoje."}
              </p>
            )}
            {!loadError && !missions.length ? (
              <p className="aa-card-actions">
                <Link className="aa-button aa-button-secondary aa-button-sm" href="/cronograma">
                  Planejar um estudo
                </Link>
              </p>
              {!missions.length ? (
                <p className="aa-card-actions">
                  <Link className="aa-button aa-button-secondary aa-button-sm" href="/cronograma">
                    Planejar um estudo
                  </Link>
                </p>
              ) : null}
            </FeatureCard>
            {missions.length ? (
              <FeatureCard
                title="Objetivos"
                description="Metas de estudo que nasceram de eventos persistidos."
                icon={<Target size={20} />}
              >
                <ul className="aa-list" aria-label="Missões de hoje">
                  {missions.map((mission) => (
                    <li className="aa-list-item aa-surface" key={mission.id}>
                      <div>
                        <strong>{mission.title}</strong>
                        <p>{mission.rewardXp} XP · {mission.status === "completed" ? "concluída" : "em aberto"}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </FeatureCard>
            ) : null}
          </FeatureCard>
          {missions.length ? (
            <FeatureCard
              title="Objetivos"
              description="Metas de estudo que nasceram de eventos persistidos."
              icon={<Target size={20} />}
            >
              <ul className="aa-list" aria-label="Missões de hoje">
                {missions.map((mission) => (
                  <li className="aa-list-item aa-surface" key={mission.id}>
                    <div>
                      <strong>{mission.title}</strong>
                      <p>{mission.rewardXp} XP · {mission.status === "completed" ? "concluída" : "em aberto"}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </FeatureCard>
          ) : null}
          {missions.length ? (
            <FeatureCard
              title="Progresso significativo"
              description="Reconhecimento de avanço, nunca vergonha, culpa ou fracasso artificial."
              icon={<Sparkles size={20} />}
            >
              <p className="aa-state-copy">
                As recompensas são calculadas pela operação atômica de conclusão de tarefa.
              </p>
            </FeatureCard>
          ) : null}
        </ArcanaFeatureGrid>
        )}
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
