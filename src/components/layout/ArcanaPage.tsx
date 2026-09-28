import Link from "next/link";
import type { ReactNode } from "react";

type ArcanaPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReadonlyArray<{ href: string; label: string; variant?: "primary" | "secondary" }>;
};

export function ArcanaPage({
  eyebrow,
  title,
  description,
  children,
  actions = [],
}: ArcanaPageProps) {
  return (
    <main className="aa-page">
      <header className="aa-page-header">
        <div>
          <p className="aa-page-eyebrow">{eyebrow}</p>
          <h1 className="aa-page-title">{title}</h1>
          <p className="aa-page-description">{description}</p>
        </div>
        {actions.length > 0 ? (
          <div className="aa-page-actions" aria-label="Ações da página">
            {actions.map((action) => (
              <Link
                key={action.href}
                className={[
                  "aa-button",
                  action.variant === "secondary"
                    ? "aa-button-secondary"
                    : "aa-button-primary",
                ].join(" ")}
                href={action.href}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </header>
      {children}
    </main>
  );
}
