import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ig-focus-stroke disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "rounded-lg bg-ig-primary text-ig-text-on-color hover:bg-ig-primary-hover active:bg-ig-primary-pressed disabled:bg-ig-primary-disabled",
        secondary:
          "rounded-lg bg-ig-secondary text-ig-btn-secondary-text hover:bg-ig-secondary-hover disabled:bg-ig-secondary-disabled disabled:text-ig-btn-secondary-text-disabled",
        borderless:
          "bg-transparent text-ig-borderless hover:text-ig-borderless-hover active:text-ig-borderless-pressed disabled:text-ig-borderless-disabled",
        tertiary:
          "rounded-lg border border-ig-tertiary-border bg-ig-tertiary-bg text-ig-tertiary-text hover:bg-ig-tertiary-hover",
        destructive:
          "bg-transparent text-ig-error hover:opacity-80 disabled:opacity-40",
      },
      size: {
        sm: "h-8 px-4 text-sm",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-sm",
        link: "h-auto p-0 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };