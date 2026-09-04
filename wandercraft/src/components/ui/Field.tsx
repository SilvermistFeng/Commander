"use client";

import { cloneElement, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink " +
  "placeholder:text-muted transition focus:border-accent focus:outline-none " +
  "focus:ring-2 focus:ring-accent/20 disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(CONTROL, "h-10", className)} {...props} />;
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(CONTROL, "min-h-20 resize-y", className)} {...props} />;
  }
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cn(CONTROL, "h-10 pr-8", className)} {...props} />;
  }
);

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactElement<{ id?: string }>;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {/* Attaching the generated id keeps the label clickable without every
          caller having to invent one. */}
      {cloneElement(children, { id: children.props.id ?? id })}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

