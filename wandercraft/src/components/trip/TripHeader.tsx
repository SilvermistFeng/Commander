"use client";

import { CalendarDays, MapPin, Share2, CircleCheck, Loader2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar, Progress } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { HeroArt } from "@/components/layout/HeroArt";
import { summariseBudget } from "@/lib/splits";
import { currentTripDay, formatCurrency, formatDateRange } from "@/lib/utils";
import type { TripOp } from "@/lib/tripClient";
import type { TripDTO } from "@/types";

export function TripHeader({
  trip,
  dayCount,
  saving,
  onJumpToToday,
  onShare,
}: {
  trip: TripDTO;
  dayCount: number;
  saving: boolean;
  onJumpToToday: () => void;
  onShare: () => void;
  onUpdate: (op: TripOp) => Promise<TripDTO | undefined>;
}) {
  const budget = summariseBudget(trip.expenses, trip.totalBudget);
  const today = currentTripDay(trip.startDate, trip.endDate);
  const accepted = trip.collaborators.filter((c) => c.status === "ACCEPTED");
  const pending = trip.collaborators.length - accepted.length;

  return (
    <section className="relative border-b border-line bg-surface">
      <HeroArt gradient={trip.coverImage} className="h-28 sm:h-32" />

      <div className="mx-auto max-w-7xl px-5 pb-6 sm:px-8">
        <div className="-mt-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="accent" className="bg-surface">
                <MapPin className="h-3 w-3" />
                {trip.destinationName}
                {trip.country ? `, ${trip.country}` : ""}
              </Badge>
              {today ? <Badge tone="sage" className="bg-surface">Day {today} of {dayCount}</Badge> : null}
              {trip.isGuest ? <Badge tone="amber" className="bg-surface">Guest</Badge> : null}
            </div>

            <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
              {trip.title}
            </h1>

            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDateRange(trip.startDate, trip.endDate)}
              </span>
              <span aria-hidden="true">·</span>
              <span>{dayCount} days</span>
              <span aria-hidden="true">·</span>
              <span>{trip.activities.length} activities</span>
              {saving ? (
                <span className="flex items-center gap-1.5 text-accent">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sage">
                  <CircleCheck className="h-3 w-3" />
                  Saved
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Collaborator stack */}
            {accepted.length > 0 ? (
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {accepted.slice(0, 4).map((c) => (
                    <Avatar key={c.id} name={c.name} size={30} className="ring-2 ring-surface" />
                  ))}
                </div>
                {pending > 0 ? (
                  <span className="ml-2.5 text-xs text-muted">+{pending} invited</span>
                ) : null}
              </div>
            ) : null}

            <Button variant="secondary" size="sm" onClick={onJumpToToday}>
              <CalendarClock className="h-4 w-4" />
              Today
            </Button>
            <Button size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Budget meter */}
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="min-w-[220px] flex-1">
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted">Budget</span>
              <span className="tnum">
                <span className={budget.isOver ? "font-semibold text-danger" : "font-semibold text-ink"}>
                  {formatCurrency(budget.spent, trip.currency)}
                </span>
                <span className="text-muted"> of {formatCurrency(budget.budget, trip.currency)}</span>
              </span>
            </div>
            <Progress
              value={budget.percentUsed}
              tone={budget.isOver ? "danger" : budget.percentUsed > 80 ? "amber" : "sage"}
              label="Budget used"
            />
          </div>
          <p className="tnum text-sm">
            {budget.isOver ? (
              <span className="font-medium text-danger">
                {formatCurrency(Math.abs(budget.remaining), trip.currency)} over
              </span>
            ) : (
              <>
                <span className="font-medium text-sage">
                  {formatCurrency(budget.remaining, trip.currency)}
                </span>
                <span className="text-muted"> left</span>
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
