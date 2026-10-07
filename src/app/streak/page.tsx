import { History, ShieldCheck } from "lucide-react";
import Image from "next/image";

import { SupabaseGamificationRepository } from "@/infrastructure/supabase/gamification/gamification-repository";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { FeatureCard } from "@/components/ui/feature-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

export default async function StreakPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();
  const repository = new SupabaseGamificationRepository(supabase);
  const profile = await repository.getProfile(claims.sub);

  return (
    <AuthenticatedShell currentPath="/streak">
      <ArcanaPage
        eyebrow="Continuidade"
        title="Streak"
        description="Acompanhe consistência a partir de eventos reais de aprendizagem, sem transformar pausas em fracasso."
      >
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
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
