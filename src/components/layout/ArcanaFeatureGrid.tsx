import type { ReactNode } from "react";

type ArcanaFeatureGridProps = {
  children: ReactNode;
};

export function ArcanaFeatureGrid({ children }: ArcanaFeatureGridProps) {
  return <div className="aa-feature-grid">{children}</div>;
}
