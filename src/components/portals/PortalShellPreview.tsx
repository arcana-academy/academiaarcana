import Link from "next/link";
import { FlontsPortrait } from "@/components/flonts/FlontsPortrait";
import { getPortalPreview, type PortalPreviewId } from "@/design-system/portal-previews/catalog";
import styles from "./PortalShellPreview.module.css";

/** Pure visual layout with no student data, permissions or active navigation. */
export function PortalShellPreview({ id }: { id: PortalPreviewId }) {
  const portal = getPortalPreview(id);
  return (
    <section className={styles.portal} aria-labelledby={`preview-${id}`}>
      <aside className={styles.sidebar} aria-label={`Áreas propostas de ${portal.title}`}>
        <strong>Academia Arcana</strong>
        <p className={styles.muted}>Navegação demonstrativa</p>
        <ul>{portal.sections.map((section) => <li key={section}>{section}</li>)}</ul>
      </aside>
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <p className={styles.muted}>Prévia visual · sem acesso funcional</p>
            <h2 id={`preview-${id}`}>{portal.title}</h2>
            <p>{portal.intro}</p>
          </div>
          <div className={styles.flonts}>
            <FlontsPortrait />
            <span>Flonts está com você</span>
          </div>
        </header>
        <div className={styles.panel}>
          <h3>Área de conteúdo</h3>
          <p className={styles.muted}>
            Estrutura reutilizável para páginas, abas, estados e ferramentas. Nenhum dado
            real é exibido, nenhuma ação de criação ou edição está disponível.
          </p>
        </div>
        {id === "professor" ? (
          <div className={styles.panel}>
            <h3>Primeiro fluxo demonstrativo</h3>
            <p>
              <Link href="/design-system/portais/professor/turmas">
                Abrir protótipo de Turmas — filtros e estados fictícios
              </Link>
            </p>
          </div>
        ) : null}
        <div className={styles.panel}>
          <h3>Bloqueio de implementação</h3>
          <p>{portal.note}</p>
        </div>
        <footer className={styles.muted}>
          Esta página é uma referência de UI/UX, não concede permissões nem habilita portais.
        </footer>
      </div>
    </section>
  );
}
