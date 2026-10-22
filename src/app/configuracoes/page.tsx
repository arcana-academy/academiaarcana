import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { Accessibility, Palette, PlugZap, ShieldCheck } from "lucide-react";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";
import { SettingsPreferences } from "@/components/accessibility/SettingsPreferences";

export default async function ConfiguracoesPage() {
  await requireAuthenticatedUser();
  return (
    <AuthenticatedShell currentPath="/configuracoes">
      <ArcanaPage
        eyebrow="Controle pessoal"
        title="Configurações"
        description="Controle acessibilidade, aparência, segurança e outras preferências sem misturar configurações com dados de domínio."
      >
        <ArcanaFeatureGrid>
          <FeatureCard title="Acessibilidade" description="Preferências de movimento, tipografia, contraste e conforto cognitivo." icon={<Accessibility size={20} />}>
            <div id="preferencias-de-leitura"><SettingsPreferences /></div>
          </FeatureCard>
          <FeatureCard title="Aparência" description="Temas são configurações de tokens, não implementações paralelas de componentes." icon={<Palette size={20} />}>
            <p className="aa-state-copy">O tema inicial segue o dispositivo. Você pode escolher Biblioteca Noturna ou Pergaminho Claro sem alterar os temas pessoais dos grimórios.</p>
            <a className="aa-button aa-button-secondary aa-button-sm" href="#preferencias-de-leitura">Ajustar aparência</a>
          </FeatureCard>
          <FeatureCard title="Segurança" description="Autenticação e autorização devem permanecer separadas da apresentação." icon={<ShieldCheck size={20} />}>
            <p className="aa-state-copy">Configurações sensíveis devem usar os fluxos server-side e as políticas de segurança existentes.</p>
          </FeatureCard>
          <FeatureCard title="Integrações" description="Conecte ferramentas externas que complementam o estudo e o planejamento." icon={<PlugZap size={20} />}>
            <p className="aa-state-copy">O Todoist pode receber tarefas e prazos do seu cronograma sem substituir a fonte de verdade educacional da Academia Arcana.</p>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/integracoes/todoist">
              Gerenciar Todoist
            </Link>
          </FeatureCard>
          <FeatureCard title="Asana" description="Envie tarefas do Cronograma para o Asana sem substituir a fonte de verdade educacional." icon={<PlugZap size={20} />}>
            <p className="aa-state-copy">A integração usa OAuth no servidor e mantém as credenciais fora do navegador.</p>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/integracoes/asana">
              Gerenciar Asana
            </Link>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
    </AuthenticatedShell>
  );
}
