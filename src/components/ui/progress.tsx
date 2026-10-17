import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  value: number;
  label?: string;
}

export function Progress({ value, label, className, ...props }: ProgressProps) {
  // Invalid measurements are indeterminate, not proof of 0% or 100% completion.
  const determinate = Number.isFinite(value);
  const normalized = determinate ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div
      className={cn("aa-progress", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={determinate ? normalized : undefined}
      {...props}
    >
      <div className="aa-progress-track" aria-hidden="true">
        <div className="aa-progress-value" style={{ width: `${normalized}%` }} />
      </div>
    </div>
  );
}
