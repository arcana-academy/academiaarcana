import { History, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SupabaseGamificationRepository } from "@/infrastructure/supabase/gamification/gamification-repository";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { FeatureCard } from "@/components/ui/feature-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/streak");

export default async function StreakPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabaseGamificationRepository(supabase);
  let profile: Awaited<ReturnType<SupabaseGamificationRepository["getProfile"]>> = null;
  let loadError = false;

  try {
    profile = await repository.getProfile(claims.sub);
  } catch {
    loadError = true;
  }

  return (
    <AuthenticatedShell currentPath="/streak">
      <ArcanaPage
        eyebrow="Continuidade"
        title="Sequência de estudos"
        description="Acompanhe consistência a partir de eventos reais de aprendizagem, sem transformar pausas em fracasso."
      >
        {loadError ? (
          <section
            className="aa-card aa-card-elevated"
            role="alert"
            aria-labelledby="streak-load-error-title"
          >
            <h2 id="streak-load-error-title">Não foi possível carregar sua sequência</h2>
            <p className="aa-state-copy">
              Não foi possível consultar suas atividades no momento. Sua sequência não foi modificada por esta consulta.
            </p>
            <div className="aa-page-actions" aria-label="Recuperação da sequência">
              <form action="/streak" method="get">
                <button type="submit" className="aa-button aa-button-primary">
                  Tentar novamente
                </button>
              </form>
              <Link className="aa-button aa-button-secondary" href="/academia">
                Ir para a Academia
              </Link>
            </div>
          </section>
        ) : (
          <ArcanaFeatureGrid>
          <FeatureCard title="Sequência atual" description="Dias consecutivos registrados pelo sistema de gamificação." icon={<Image src="/assets/gamification/aa-contained-arcane-flame.svg" alt="" width={22} height={22} />}>
            <p className="aa-state-copy">
              {profile ? `${profile.streakDays} ${profile.streakDays === 1 ? "dia" : "dias"}` : "Nenhuma atividade registrada ainda."}
            </p>
          </FeatureCard>
          <FeatureCard title="Última atividade" description="A data usada como referência pela continuidade persistida." icon={<History size={20} />}>
            <p className="aa-state-copy">{profile?.lastActiveOn ?? "Nenhuma atividade registrada ainda."}</p>
          </FeatureCard>
          <FeatureCard title="Sem punição" description="Uma pausa não deve transformar a experiência em fracasso." icon={<ShieldCheck size={20} />}>
            <p className="aa-state-copy">Sua sequência é apenas um indicador de continuidade. Ela não reduz seu progresso quando você precisa pausar.</p>
          </FeatureCard>
          </ArcanaFeatureGrid>
        )}
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
