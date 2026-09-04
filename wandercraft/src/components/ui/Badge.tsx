import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "sage" | "amber" | "danger" | "teal" | "outline";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-2 border-line",
  accent: "bg-accent-wash text-accent border-accent/25",
  sage: "bg-sage-wash text-sage border-sage/25",
  amber: "bg-amber-wash text-amber border-amber/30",
  danger: "bg-danger-wash text-danger border-danger/30",
  teal: "bg-teal-wash text-teal border-teal/30",
  outline: "bg-transparent text-muted border-line",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium leading-5",
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}
