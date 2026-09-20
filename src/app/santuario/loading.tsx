import type { CSSProperties } from "react";

const skeletonBlockStyle: CSSProperties = {
    background: "var(--aa-surfaces-inset)",
    border: "1px solid var(--aa-border-default)",
    borderRadius: "var(--aa-radius-md)",
};

const sectionSpacingStyle: CSSProperties = {
    marginTop: "var(--aa-spacing-lg)",
};

/**
 * Structural skeleton for the authenticated Sanctuary route.
 *
 * Mirrors the real layout — header, primary action and main areas — so the
 * segment never falls back to a blank screen while data loads. It renders
 * without any Supabase client or repository, contains no data, and uses no
 * animations, so reduced-motion preferences are respected. The placeholder
 * blocks are decorative (`aria-hidden`); the loading state itself is announced
 * through the visible heading and the `role="status"` message.
 */
export default function SanctuaryLoading() {
    return (
        <main aria-busy="true" aria-labelledby="sanctuary-loading-title">
            <h1 id="sanctuary-loading-title">Carregando o Santuário</h1>

            <p role="status">Buscando seu contexto de aprendizagem…</p>

            <div aria-hidden="true" data-testid="sanctuary-loading-skeleton">
                <div
                    className="aa-card aa-card-default"
                    data-testid="sanctuary-loading-header"
                >
                    <div
                        style={{
                            ...skeletonBlockStyle,
                            height: "1.75rem",
                            width: "60%",
                        }}
                    />

                    <div
                        style={{
                            ...skeletonBlockStyle,
                            height: "1rem",
                            marginTop: "var(--aa-spacing-sm)",
                            width: "35%",
                        }}
                    />
                </div>

                <div
                    className="aa-card aa-card-default"
                    data-testid="sanctuary-loading-primary-action"
                    style={sectionSpacingStyle}
                >
                    <div
                        style={{
                            ...skeletonBlockStyle,
                            height: "2.5rem",
                            width: "100%",
                        }}
                    />
                </div>

                <div
                    className="aa-card aa-card-default"
                    data-testid="sanctuary-loading-areas"
                    style={sectionSpacingStyle}
                >
                    <div
                        style={{
                            ...skeletonBlockStyle,
                            height: "6rem",
                            width: "100%",
                        }}
                    />

                    <div
                        style={{
                            ...skeletonBlockStyle,
                            height: "6rem",
                            marginTop: "var(--aa-spacing-md)",
                            width: "100%",
                        }}
                    />
                </div>
            </div>
        </main>
    );
}
