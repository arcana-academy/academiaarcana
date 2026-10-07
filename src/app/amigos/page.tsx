import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { HeartHandshake, MessageCircle, Users } from "lucide-react";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";

export default async function AmigosPage() {
  await requireAuthenticatedUser();
  return (
    <AuthenticatedShell currentPath="/amigos">
      <ArcanaPage
        eyebrow="Social"
        title="Amigos"
        description="Conecte-se com outras pessoas de forma consciente, contextual e permissionada."
      >
        <ArcanaFeatureGrid>
          <FeatureCard title="Sua rede" description="Pessoas e vínculos compartilhados somente quando autorizados." icon={<Users size={20} />}>
            <p className="aa-state-copy">Nenhuma conexão social persistida está disponível.</p>
          </FeatureCard>
          <FeatureCard title="Mensagens" description="Comunicação contextual com controles claros de privacidade." icon={<MessageCircle size={20} />}>
            <p className="aa-state-copy">O sistema de mensagens ainda não está configurado.</p>
          </FeatureCard>
          <FeatureCard title="Compartilhar com intenção" description="Nada deve ser compartilhado automaticamente." icon={<HeartHandshake size={20} />}>
            <p className="aa-state-copy">As futuras ações de compartilhamento deverão passar por autorização explícita.</p>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
