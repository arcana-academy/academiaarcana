import Link from "next/link";
import { Sparkles } from "lucide-react";

import type { QuickAction, SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryHeaderProps = {
  header: SanctuaryViewModel["header"];
  primaryAction: QuickAction;
};

/** Identity header for the authenticated Sanctuary. */
export function SanctuaryHeader({
  header,
  primaryAction,
}: SanctuaryHeaderProps) {
  const displayName = header.user.displayName?.trim();

  return (
    <header className="sanctuary-hero aa-card aa-card-elevated">
      <div className="sanctuary-hero-copy">
        <p className="aa-eyebrow">Santuário</p>
        <div className="sanctuary-title-line">
          <span className="sanctuary-title-mark" aria-hidden="true">
            <Sparkles size={20} strokeWidth={1.8} />
          </span>
          <h1 id="sanctuary-title">{header.greeting}</h1>
        </div>

        {displayName ? (
          <p data-testid="sanctuary-user-name">
            {displayName}, este é o ponto de retomada da sua jornada.
          </p>
        ) : null}
      </div>

      <div className="aa-actions">
        <Link
          className="aa-button aa-button-primary aa-button-lg"
          href={primaryAction.href}
        >
          {primaryAction.label}
        </Link>
      </div>
    </header>
  );
}
