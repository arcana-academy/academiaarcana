import type { QuickAction, SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryHeaderProps = {
  header: SanctuaryViewModel["header"];
  primaryAction: QuickAction;
};

export function SanctuaryHeader({ header, primaryAction }: SanctuaryHeaderProps) {
  const displayName = header.user.displayName?.trim();

  return (
    <header className="aa-sanctuary-hero">
      <div className="aa-sanctuary-hero-copy">
        <span className="aa-section-kicker">Seu espaço de estudo</span>
        <h1 id="sanctuary-title">{header.greeting}</h1>
        {displayName ? (
          <p className="aa-sanctuary-user" data-testid="sanctuary-user-name">
            {displayName}
          </p>
        ) : null}
        <p className="aa-sanctuary-lead">
          Um ponto de partida claro para retomar o que importa e escolher o próximo passo.
        </p>
      </div>

      <div className="aa-sanctuary-hero-action">
        <span className="aa-hero-mark" aria-hidden="true">✦</span>
        <a className="aa-button aa-button-primary aa-button-lg" href={primaryAction.href}>
          {primaryAction.label}
        </a>
      </div>
    </header>
  );
}
