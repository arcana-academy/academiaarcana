import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "warning" | "danger" | "info";
  children: ReactNode;
}

export function Badge({ className, variant = "neutral", children, ...props }: BadgeProps) {
  return (
    <span className={cn("aa-badge", `aa-badge-${variant}`, className)} {...props}>
      {children}
    </span>
  );
}
