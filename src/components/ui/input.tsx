import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { id: providedId, className, label, description, error, ...props },
    ref,
  ) {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const descriptionId = description ? `${id}-description` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

    const elementMap = {
      label: label ? <label htmlFor={id}>{label}</label> : null,
      description: description
        ? <p id={descriptionId} className="aa-field-description">{description}</p>
        : null,
      error: error
        ? <p id={errorId} className="aa-field-error" role="alert">{error}</p>
        : null,
    };

    return (
      <div className="aa-field">
        {elementMap.label}
        <input
          {...props}
          ref={ref}
          id={id}
          className={cn("aa-input", error && "aa-input-error", className)}
          aria-describedby={describedBy}
          aria-invalid={error ? true : props["aria-invalid"]}
        />
        {elementMap.description}
        {elementMap.error}
      </div>
    );
  },
);
