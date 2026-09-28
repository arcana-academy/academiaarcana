import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="aa-page-header">
      <div className="aa-page-header-copy">
        {eyebrow ? <p className="aa-page-eyebrow">{eyebrow}</p> : null}
        <h1 className="aa-page-title">{title}</h1>
        {description ? (
          <p className="aa-page-description">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="aa-page-header-actions">{actions}</div> : null}
    </header>
  );
}
