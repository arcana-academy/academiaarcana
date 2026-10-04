import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type FeatureCardProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  children?: ReactNode;
};

export function FeatureCard({
  title,
  description,
  icon,
  children,
}: FeatureCardProps) {
  return (
    <Card as="article" variant="elevated" className="aa-feature-card">
      <div className="aa-feature-card-heading">
        {icon ? <span className="aa-feature-icon" aria-hidden="true">{icon}</span> : null}
        <div>
          <h2 className="aa-feature-title">{title}</h2>
          <p className="aa-feature-description">{description}</p>
        </div>
      </div>
      {children ? <div className="aa-feature-card-content">{children}</div> : null}
    </Card>
  );
}
