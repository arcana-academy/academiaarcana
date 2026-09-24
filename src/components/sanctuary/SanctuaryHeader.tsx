import type { QuickAction, SanctuaryViewModel } from "@/domains/sanctuary";

type SanctuaryHeaderProps = {
    header: SanctuaryViewModel["header"];
    primaryAction: QuickAction;
};

/**
 * Identity header for the authenticated Sanctuary.
 *
 * Renders the greeting as the level-one heading that labels `<main>`, the
 * optional user display name, and the already-resolved primary action as a
 * semantic link. Priority resolution stays in the domain/application layers,
 * so this component never re-derives it from `primaryAction.priority`.
 *
 * Styling reuses the existing `aa-card`/`aa-button` classes and design tokens
 * from `globals.css` (including the global `:focus-visible` outline and the
 * density-scaled target size), so no new visual tokens are introduced.
 */
export function SanctuaryHeader({
    header,
    primaryAction,
}: SanctuaryHeaderProps) {
    const displayName = header.user.displayName?.trim();

    return (
        <header className="aa-card aa-card-default">
            <h1 id="sanctuary-title">{header.greeting}</h1>

            {displayName ? (
                <p data-testid="sanctuary-user-name">{displayName}</p>
            ) : null}

            <a
                className="aa-button aa-button-primary aa-button-lg"
                href={primaryAction.href}
            >
                {primaryAction.label}
            </a>
        </header>
    );
}
