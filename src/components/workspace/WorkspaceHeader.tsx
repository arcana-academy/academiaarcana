"use client";

import type { ReactNode } from "react";

type WorkspaceHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
};

export function WorkspaceHeader({
  title,
  actionLabel,
  onAction,
  children,
}: WorkspaceHeaderProps) {
  return (
    <header className="workspace-header">
      <div className="workspace-header-copy">
        <span className="workspace-header-kicker" aria-hidden="true">
          Workspace
        </span>
        <h1>{title}</h1>
      </div>
      {actionLabel ? (
        <button
          className="aa-button aa-button-secondary"
          type="button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
      {children}
    </header>
  );
}
