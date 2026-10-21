"use client";

import { useId, type ComponentProps } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type InputProps = Omit<ComponentProps<"input">, "placeholder"> & {
  label: string;
  error?: string;
  status?: "success" | "error";
};

export function Input({
  label,
  error,
  status,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const hasError = Boolean(error) || status === "error";

  return (
    <div className="w-full">
      <div className="relative">
        <input
          id={inputId}
          placeholder=" "
          aria-invalid={hasError}
          className={cn(
            "peer h-[50px] w-full rounded-xl border bg-ig-bg px-3 pb-1 pt-4 text-sm text-ig-input-text outline-none transition-colors",
            "border-ig-input-border focus:border-ig-input-border-focus",
            "disabled:bg-ig-input-disabled-bg",
            hasError && "border-ig-error",
            status && "pr-10",
            className,
          )}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ig-input-placeholder transition-all",
            "peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px]",
            "peer-not-placeholder-shown:top-2.5 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[11px]",
          )}
        >
          {label}
        </label>
        {status === "success" && (
          <Check
            aria-hidden
            className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-ig-success"
          />
        )}
        {status === "error" && (
          <X
            aria-hidden
            className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-ig-error"
          />
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-ig-error">
          {error}
        </p>
      )}
    </div>
  );
}
