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
    <header>
      <h1>{title}</h1>
      {actionLabel ? (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
      {children}
    </header>
  );
}
