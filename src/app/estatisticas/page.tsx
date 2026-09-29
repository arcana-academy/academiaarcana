import { BarChart3, BookOpen, Clock3, Flame, Target, TrendingUp } from "lucide-react";

import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { createClient } from "@/lib/supabase/server";

export default async function EstatisticasPage() {
  const claims = await requireAuthenticatedUser();
  const supabase = await createClient();

  const [progressResult, tasksResult, focusResult, profileResult] = await Promise.all([
    supabase.from("page_progress").select("id, status").eq("owner_id", claims.sub),
    supabase.from("study_tasks").select("id, status").eq("owner_id", claims.sub),
    supabase.from("focus_sessions").select("duration_seconds, completed_at").eq("owner_id", claims.sub),
    supabase.from("gamification_profiles").select("xp, streak_days").eq("owner_id", claims.sub).maybeSingle(),
  ]);

  for (const result of [progressResult, tasksResult, focusResult, profileResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const progress = progressResult.data ?? [];
  const tasks = tasksResult.data ?? [];
  const focus = focusResult.data ?? [];
  const completedPages = progress.filter((item) => item.status === "completed").length;
  const inProgressPages = progress.filter((item) => item.status === "in-progress").length;
  const completedTasks = tasks.filter((item) => item.status === "completed").length;
  const completedFocus = focus.filter((item) => item.completed_at !== null);
  const focusMinutes = Math.round(
    completedFocus.reduce((total, session) => total + session.duration_seconds, 0) / 60,
  );
  const xp = Number(profileResult.data?.xp ?? 0);
  const streak = Number(profileResult.data?.streak_days ?? 0);

  return (
    <AuthenticatedShell currentPath="/estatisticas">
      <ArcanaPage
        eyebrow="Conhecimento sobre sua jornada"
        title="Estatísticas"
        description="Métricas derivadas somente dos eventos de aprendizagem e foco registrados para sua conta."
      >
        <ArcanaFeatureGrid>
          <FeatureCard title="Aprendizagem" description="Páginas concluídas e em andamento." icon={<BookOpen size={22} />}>
            <p className="aa-state-copy">{completedPages} concluídas · {inProgressPages} em andamento</p>
          </FeatureCard>
          <FeatureCard title="Tarefas" description="Tarefas de estudo efetivamente concluídas." icon={<Target size={22} />}>
            <p className="aa-state-copy">{completedTasks} concluídas</p>
          </FeatureCard>
          <FeatureCard title="Foco" description="Tempo de sessões de foco concluídas." icon={<Clock3 size={22} />}>
            <p className="aa-state-copy">{focusMinutes} minutos registrados</p>
          </FeatureCard>
          <FeatureCard title="XP" description="Experiência concedida por operações reais de aprendizagem." icon={<BarChart3 size={22} />}>
            <p className="aa-state-copy">{xp} XP</p>
          </FeatureCard>
          <FeatureCard title="Streak" description="Continuidade registrada pelo sistema." icon={<Flame size={22} />}>
            <p className="aa-state-copy">{streak} {streak === 1 ? "dia" : "dias"}</p>
          </FeatureCard>
          <FeatureCard title="Tendência" description="Nenhuma tendência é inventada quando ainda não há histórico suficiente." icon={<TrendingUp size={22} />}>
            <p className="aa-state-copy">{completedTasks + completedPages + completedFocus.length === 0 ? "Ainda sem histórico suficiente." : "Dados reais disponíveis para acompanhamento."}</p>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
