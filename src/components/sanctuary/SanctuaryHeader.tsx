import { Sparkles } from "lucide-react";
import type { QuickAction, SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryHeaderProps = {
  header: SanctuaryViewModel["header"];
  primaryAction: QuickAction;
};

export function SanctuaryHeader({ header, primaryAction }: SanctuaryHeaderProps) {
  const displayName = header.user.displayName?.trim();

  return (
    <header className="aa-card aa-card-elevated aa-sanctuary-hero">
      <div className="aa-sanctuary-hero-copy">
        <div className="aa-card-icon" aria-hidden="true">
          <Sparkles size={20} strokeWidth={1.8} />
        </div>
        <p className="aa-eyebrow">Santuário</p>
        <h1 id="sanctuary-title">{header.greeting}</h1>
        {displayName ? (
          <p className="aa-sanctuary-identity" data-testid="sanctuary-user-name">
            {displayName}
          </p>
        ) : null}
      </div>
      <a
        className="aa-button aa-button-primary aa-button-lg aa-sanctuary-hero-action"
        href={primaryAction.href}
      >
        {primaryAction.label}
      </a>
    </header>
  );
}
