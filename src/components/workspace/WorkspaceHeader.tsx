"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

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
      <div className="workspace-header-title">
        <p className="aa-eyebrow">Workspace</p>
        <div className="workspace-title-line">
          <Sparkles aria-hidden="true" size={18} strokeWidth={1.8} />
          <h1>{title}</h1>
        </div>
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
