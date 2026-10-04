import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: "default" | "elevated" | "inset";
  as?: "section" | "article" | "div";
  children: ReactNode;
}

export function Card({
  className,
  variant = "default",
  as = "section",
  children,
  ...props
}: CardProps) {
  const classNames = cn("aa-card", `aa-card-${variant}`, className);

  if (as === "article") {
    return (
      <article className={classNames} {...props}>
        {children}
      </article>
    );
  }

  if (as === "div") {
    return (
      <div className={classNames} {...props}>
        {children}
      </div>
    );
  }

  return (
    <section className={classNames} {...props}>
      {children}
    </section>
  );
}
