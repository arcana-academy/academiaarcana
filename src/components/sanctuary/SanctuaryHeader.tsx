import type { QuickAction, SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryHeaderProps = {
  header: SanctuaryViewModel["header"];
  primaryAction: QuickAction;
};

export function SanctuaryHeader({ header, primaryAction }: SanctuaryHeaderProps) {
  const displayName = header.user.displayName?.trim();

  return (
    <header className="aa-sanctuary-hero">
      <div className="aa-sanctuary-hero-atmosphere" aria-hidden="true">
        <span className="aa-sanctuary-sigil">✦</span>
      </div>

      <div className="aa-sanctuary-hero-copy">
        <p className="aa-page-header-eyebrow">Santuário</p>
        <h1 id="sanctuary-title">{header.greeting}</h1>
        {displayName ? (
          <p className="aa-sanctuary-user" data-testid="sanctuary-user-name">
            {displayName}
          </p>
        ) : null}
        <p className="aa-sanctuary-hero-text">
          Retome o fio da sua jornada, encontre o próximo passo e avance no seu próprio ritmo.
        </p>
      </div>

      <div className="aa-sanctuary-hero-action">
        <a
          className="aa-button aa-button-primary aa-button-lg"
          href={primaryAction.href}
        >
          {primaryAction.label}
        </a>
      </div>
    </header>
  );
}
