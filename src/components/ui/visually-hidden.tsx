import type { HTMLAttributes, ReactNode } from "react";

export function VisuallyHidden({ children, ...props }: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span className="aa-visually-hidden" {...props}>
      {children}
    </span>
  );
}
