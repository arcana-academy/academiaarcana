import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("aa-skeleton-block", className)}
      {...props}
    />
  );
}
