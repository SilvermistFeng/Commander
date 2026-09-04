"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Compass, FileText, MapPin, Users, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, Progress } from "@/components/ui/Misc";
import { HeroArt } from "@/components/layout/HeroArt";
import { loadAllGuestTrips } from "@/lib/storage";
import { summariseBudget } from "@/lib/splits";
import { currentTripDay, formatCurrency, formatDateRange, tripDayCount } from "@/lib/utils";
import type { TripDTO } from "@/types";

export function TripsDashboard({ trips }: { trips: TripDTO[] }) {
  // Trips still sitting in this browser from before the user signed in.
  const [strays, setStrays] = useState<TripDTO[]>([]);
  useEffect(() => {
    let cancelled = false;
    loadAllGuestTrips().then((found) => {
      if (!cancelled) setStrays(found);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (trips.length === 0 && strays.length === 0) {
    return (
      <EmptyState
        icon={<Compass className="h-7 w-7" />}
        title="No trips yet"
        body="Pick a destination from the homepage and you'll be inside a working itinerary in one click."
        action={
          <Link
            href="/"
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink transition hover:bg-accent-hover"
          >
            Browse destinations
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => {
          const budget = summariseBudget(trip.expenses, trip.totalBudget);
          const days = tripDayCount(trip.startDate, trip.endDate);
          const today = currentTripDay(trip.startDate, trip.endDate);
          const upcoming = new Date(trip.startDate) > new Date();

          return (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-ambient transition duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift"
            >
              <HeroArt gradient={trip.coverImage} className="h-32 shrink-0">
                <div className="flex h-full flex-col justify-between p-4">
                  <div className="flex justify-end">
                    {today ? (
                      <span className="rounded-lg bg-white/20 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                        Day {today} of {days}
                      </span>
                    ) : upcoming ? (
                      <span className="rounded-lg bg-white/15 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                        Upcoming
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-medium leading-tight text-white drop-shadow-sm">
                      {trip.title}
                    </h2>
                    <p className="flex items-center gap-1.5 text-sm text-white/80">
                      <MapPin className="h-3 w-3" />
                      {trip.destinationName}
                      {trip.country ? `, ${trip.country}` : ""}
                    </p>
                  </div>
                </div>
              </HeroArt>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <p className="flex items-center gap-1.5 text-[13px] text-muted">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDateRange(trip.startDate, trip.endDate)}
                </p>

                <div className="flex flex-wrap gap-3 text-[13px] text-ink-2">
                  <span className="flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-muted" />
                    {trip.activities.length}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted" />
                    {trip.documents.length}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted" />
                    {trip.collaborators.filter((c) => c.status === "ACCEPTED").length}
                  </span>
                </div>

                <div className="mt-auto space-y-1.5 border-t border-line pt-3">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-1.5 text-muted">
                      <Wallet className="h-3.5 w-3.5" />
                      Budget
                    </span>
                    <span className="tnum font-medium">
                      {formatCurrency(budget.spent, trip.currency)} / {formatCurrency(budget.budget, trip.currency)}
                    </span>
                  </div>
                  <Progress
                    value={budget.percentUsed}
                    tone={budget.isOver ? "danger" : budget.percentUsed > 80 ? "amber" : "sage"}
                    label={`${trip.title} budget`}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {strays.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-medium tracking-tight">Still in this browser</h2>
          <p className="mt-0.5 text-sm text-muted">
            These were made before you signed in and haven&rsquo;t been synced. Open one and sign in again to
            move it across.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {strays.map((s) => (
              <Link
                key={s.id}
                href={`/trips/${s.id}`}
                className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm transition hover:border-line-strong"
              >
                <Badge tone="amber">Guest</Badge>
                <span className="font-medium">{s.title}</span>
                <span className="text-muted">{s.destinationName}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
