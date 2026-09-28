import { Accessibility, Palette, ShieldCheck } from "lucide-react";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";

export default function ConfiguracoesPage() {
  return (
    <AuthenticatedShell currentPath="/configuracoes">
      <ArcanaPage
        eyebrow="Controle pessoal"
        title="Configurações"
        description="Controle acessibilidade, aparência, segurança e outras preferências sem misturar configurações com dados de domínio."
      >
        <ArcanaFeatureGrid>
          <FeatureCard title="Acessibilidade" description="Preferências de movimento, tipografia, contraste e conforto cognitivo." icon={<Accessibility size={22} />}>
            <p className="aa-state-copy">As preferências de acessibilidade existentes continuam sendo a fonte de verdade.</p>
          </FeatureCard>
          <FeatureCard title="Aparência" description="Temas são configurações de tokens, não implementações paralelas de componentes." icon={<Palette size={22} />}>
            <p className="aa-state-copy">A fundação visual Arcane está ativa; presets adicionais podem ser conectados ao sistema de temas.</p>
          </FeatureCard>
          <FeatureCard title="Segurança" description="Autenticação e autorização devem permanecer separadas da apresentação." icon={<ShieldCheck size={22} />}>
            <p className="aa-state-copy">Configurações sensíveis devem usar os fluxos server-side e as políticas de segurança existentes.</p>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
