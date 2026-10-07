import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "./PageHeader";

export type FeaturePageItem = {
  title: string;
  description: string;
};

type FeaturePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: readonly FeaturePageItem[];
};

export function FeaturePage({ eyebrow, title, description, items }: FeaturePageProps) {
  return (
    <div className="aa-feature-page">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <section aria-labelledby="feature-page-foundation" className="aa-section-block">
        <div className="aa-section-heading">
          <div>
            <p className="aa-page-eyebrow">Fundação</p>
            <h2 id="feature-page-foundation">Estrutura preparada para crescer</h2>
          </div>
        </div>

        <div className="aa-feature-grid">
          {items.map((item) => (
            <article className="aa-card aa-card-default" key={item.title}>
              <h3>{item.title}</h3>
              <p className="aa-page-description">{item.description}</p>
              <span className="aa-feature-status">
                Estrutura de interface criada
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="aa-card aa-card-inset aa-feature-next" aria-labelledby="feature-page-next">
        <div>
          <p className="aa-page-eyebrow">Próxima camada</p>
          <h2 id="feature-page-next">Conecte dados e regras reais desta seção</h2>
          <p className="aa-page-description">
            O layout já possui uma entrada consistente e acessível. A lógica específica deve ser
            ligada aos contratos de domínio, aplicação e infraestrutura sem duplicar estado.
          </p>
        </div>
        <Link className="aa-button aa-button-secondary" href="/santuario">
          Voltar ao Santuário
          <ArrowRight size={20} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
