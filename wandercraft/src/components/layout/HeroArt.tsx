import { cn } from "@/lib/utils";

/**
 * Destination artwork. `gradient` comes from the seeded catalogue as a CSS
 * gradient string, so a card paints instantly and never shows a broken image.
 */
export function HeroArt({
  gradient,
  className,
  children,
}: {
  gradient?: string | null;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn("grain relative overflow-hidden", className)}
      style={{ background: gradient ?? "linear-gradient(145deg, #D95338 0%, #E8A33D 50%, #2D5A46 100%)" }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/55 via-stone-950/5 to-transparent" />
      {children ? <div className="relative h-full">{children}</div> : null}
    </div>
  );
}
