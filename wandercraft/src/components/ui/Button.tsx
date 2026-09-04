"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "sage" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-accent-hover shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
  secondary:
    "bg-surface text-ink border border-line hover:border-line-strong hover:bg-surface-2",
  subtle: "bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  sage: "bg-sage text-sage-ink hover:bg-sage-hover",
  danger: "bg-danger-wash text-danger border border-danger/25 hover:bg-danger hover:text-white",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2.5",
  icon: "h-9 w-9 justify-center",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center rounded-lg font-medium transition-all duration-150",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
});
