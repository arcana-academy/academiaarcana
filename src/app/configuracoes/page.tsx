import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { Accessibility, Palette, PlugZap, ShieldCheck, Ear, Keyboard, Brain, Eye, BookOpenText } from "lucide-react";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";
import { ReadingPreferencesControls } from "@/components/personalization/ReadingPreferencesControls";

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
          <section id="accessibilidade" aria-label="Central de Acessibilidade">
            <FeatureCard title="Central de Acessibilidade" description="Recursos acessíveis organizados em seis categorias." icon={<Accessibility size={20} />}>
              <ul className="aa-accessibility-categories">
                <li><Eye size={17} aria-hidden="true" /> Visão e leitura</li>
                <li><Ear size={17} aria-hidden="true" /> Audição e mídia</li>
                <li><Keyboard size={17} aria-hidden="true" /> Mobilidade e controle</li>
                <li><Brain size={17} aria-hidden="true" /> Cognição e foco</li>
                <li><Accessibility size={17} aria-hidden="true" /> Tecnologias assistivas</li>
                <li><BookOpenText size={17} aria-hidden="true" /> Estudo acessível</li>
              </ul>
              <p className="aa-state-copy">Os recursos essenciais não dependem de ativação. Preferências adicionais serão oferecidas à medida que estiverem implementadas e verificadas.</p>
              <Link className="aa-button aa-button-secondary aa-button-sm" href="/personalizar">
                Ajustar tema e movimento
              </Link>
              <ReadingPreferencesControls expanded />
            </FeatureCard>
          </section>
          <FeatureCard title="Aparência" description="Tema automático por dispositivo, Biblioteca Noturna e Pergaminho Claro, com escolha manual." icon={<Palette size={20} />}>
            <p className="aa-state-copy">A preferência de aparência pode ser alterada em Personalizar, sem afetar a identidade canônica.</p>
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
