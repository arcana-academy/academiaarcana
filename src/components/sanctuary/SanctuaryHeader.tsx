import Image from "next/image";
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
        <p className="aa-eyebrow">Santuário · sua jornada</p>
        <h1 id="sanctuary-title">{header.greeting}</h1>
        {displayName ? (
          <p className="aa-sanctuary-hero-lede" data-testid="sanctuary-user-name">
            {displayName}, siga o fio da sua jornada com clareza, presença e um próximo passo de cada vez.
          </p>
        ) : (
          <p className="aa-sanctuary-hero-lede">
            Siga o fio da sua jornada com clareza, presença e um próximo passo de cada vez.
          </p>
        )}
        <div className="aa-sanctuary-hero-action">
          <a className="aa-button aa-button-primary aa-button-lg" href={primaryAction.href}>
            {primaryAction.label}
          </a>
        </div>
      </div>

      <div className="aa-sanctuary-hero-atmosphere" aria-hidden="true">
        <div className="aa-sanctuary-sigil">
          <Image
            src="/assets/sanctuary/aa-sanctuary-sigil.svg"
            alt=""
            width={128}
            height={128}
            priority
          />
        </div>
      </div>
    </header>
  );
}
