import Link from "next/link";
import { Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-ink">
            <Compass className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-medium">WanderCraft</span>
        </div>
        <p className="text-sm text-muted">
          Maps by{" "}
          <Link href="https://www.openstreetmap.org/copyright" className="underline underline-offset-2 hover:text-ink">
            OpenStreetMap
          </Link>
          . Forecasts by{" "}
          <Link href="https://open-meteo.com" className="underline underline-offset-2 hover:text-ink">
            Open-Meteo
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
