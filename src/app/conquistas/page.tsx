import { Award, Crown, Gem } from "lucide-react";

import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

export default async function ConquistasPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();

  const [profileResult, taskResult, pageResult] = await Promise.all([
    supabase.from("gamification_profiles").select("xp, streak_days").eq("owner_id", claims.sub).maybeSingle(),
    supabase.from("study_tasks").select("id").eq("owner_id", claims.sub).eq("status", "completed"),
    supabase.from("page_progress").select("id").eq("owner_id", claims.sub).eq("status", "completed"),
  ]);

  for (const result of [profileResult, taskResult, pageResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const xp = Number(profileResult.data?.xp ?? 0);
  const streak = Number(profileResult.data?.streak_days ?? 0);
  const completedTasks = taskResult.data?.length ?? 0;
  const completedPages = pageResult.data?.length ?? 0;
  const achievements = [
    { title: "Primeiro passo", description: "Conclua sua primeira tarefa ou página.", unlocked: completedTasks + completedPages >= 1, icon: <Award size={22} /> },
    { title: "Centelha Arcana", description: "Alcance 100 XP de aprendizagem.", unlocked: xp >= 100, icon: <Gem size={22} /> },
    { title: "Sete dias", description: "Mantenha sete dias de continuidade registrados.", unlocked: streak >= 7, icon: <Crown size={22} /> },
  ];

  return (
    <AuthenticatedShell currentPath="/conquistas">
      <ArcanaPage
        eyebrow="Reconhecimento"
        title="Conquistas"
        description="Marcos derivados de eventos reais. Nada é desbloqueado apenas para preencher a interface."
      >
        <ArcanaFeatureGrid>
          {achievements.map((achievement) => (
            <FeatureCard key={achievement.title} title={achievement.title} description={achievement.description} icon={achievement.icon}>
              <p className="aa-state-copy">{achievement.unlocked ? "Desbloqueada" : "Ainda não desbloqueada"}</p>
            </FeatureCard>
          ))}
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
