import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { Accessibility, Palette, PlugZap, ShieldCheck } from "lucide-react";
import { ArcanaFeatureGrid } from "@/components/layout/ArcanaFeatureGrid";
import { ArcanaPage } from "@/components/layout/ArcanaPage";
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell";
import { FeatureCard } from "@/components/ui/feature-card";
import { pageMetadata } from "@/lib/seo/site-metadata";

export const metadata = pageMetadata("/configuracoes");

/** Presentation-only content shared with isolated visual fixtures; auth remains in route. */
export function ConfiguracoesContent() {
  return (
      <ArcanaPage
        eyebrow="Controle pessoal"
        title="Configurações"
        description="Controle acessibilidade, aparência, segurança e outras preferências sem misturar configurações com dados de domínio."
      >
        <nav className="aa-c106-settings-tabs" aria-label="Seções de configurações">
          <a href="#conta">Conta</a>
          <a href="#aparencia">Aparência</a>
          <a href="#acessibilidade">Acessibilidade</a>
          <a href="#privacidade">Privacidade</a>
          <a href="#integracoes">Integrações</a>
        </nav>
        <ArcanaFeatureGrid>
          <section id="conta" className="aa-c106-settings-group" aria-label="Conta">
            <FeatureCard title="Conta" description="Sua identidade e preferências pessoais." icon={<ShieldCheck size={20} />}>
              <Link className="aa-button aa-button-secondary aa-button-sm" href="/perfil">Ver meu perfil</Link>
            </FeatureCard>
          </section>
          <section id="acessibilidade" className="aa-c106-settings-group" aria-label="Acessibilidade">
          <FeatureCard title="Acessibilidade" description="Preferências de movimento, tipografia, contraste e conforto cognitivo." icon={<Accessibility size={20} />}>
            <p className="aa-state-copy">Redução de movimento e conforto visual usam as preferências já disponíveis.</p>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/personalizar">Ajustar acessibilidade</Link>
          </FeatureCard>
          </section>
          <section id="aparencia" className="aa-c106-settings-group" aria-label="Aparência">
          <FeatureCard title="Aparência" description="Temas são configurações de tokens, não implementações paralelas de componentes." icon={<Palette size={20} />}>
            <div className="aa-c106-theme-swatches" aria-label="Referências de tons, sem alterar o tema">
              <span className="aa-c106-swatch aa-c106-swatch-arcane">Arcano</span>
              <span className="aa-c106-swatch aa-c106-swatch-amethyst">Ametista</span>
              <span className="aa-c106-swatch aa-c106-swatch-sepia">Sépia</span>
            </div>
            <p className="aa-state-copy">Os temas selecionáveis e a preferência de movimento permanecem centralizados em Personalizar.</p>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/personalizar">Escolher tema</Link>
          </FeatureCard>
          </section>
          <section id="privacidade" className="aa-c106-settings-group" aria-label="Privacidade e segurança">
          <FeatureCard title="Segurança" description="Autenticação e autorização devem permanecer separadas da apresentação." icon={<ShieldCheck size={20} />}>
            <p className="aa-state-copy">Nenhuma alteração de senha, sessão ou permissão é feita neste painel ilustrativo.</p>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/perfil">Consultar perfil</Link>
          </FeatureCard>
          </section>
          <section id="integracoes" className="aa-c106-settings-group" aria-label="Integrações">
          <FeatureCard title="Integrações" description="Conecte ferramentas externas que complementam o estudo e o planejamento." icon={<PlugZap size={20} />}>
            <p className="aa-state-copy">O Todoist pode receber tarefas e prazos do seu cronograma sem substituir a fonte de verdade educacional da Academia Arcana.</p>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/integracoes/todoist">
              Gerenciar Todoist
            </Link>
          </FeatureCard>
          </section>
          <FeatureCard title="Asana" description="Envie tarefas do Cronograma para o Asana sem substituir a fonte de verdade educacional." icon={<PlugZap size={20} />}>
            <p className="aa-state-copy">A integração usa OAuth no servidor e mantém as credenciais fora do navegador.</p>
            <Link className="aa-button aa-button-secondary aa-button-sm" href="/integracoes/asana">
              Gerenciar Asana
            </Link>
          </FeatureCard>
        </ArcanaFeatureGrid>
      </ArcanaPage>
  );
}

export default async function ConfiguracoesPage() {
  await requireAuthenticatedUser();
  return (
    <AuthenticatedShell currentPath="/configuracoes">
      <ConfiguracoesContent />
    </AuthenticatedShell>
  );
}
