"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Loader2, Sparkles, Wallet, Clock, Lightbulb } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TripMap, type MapPoint } from "@/components/map/TripMap";
import { ACTIVITY_CATEGORIES } from "@/lib/categories";
import { formatCurrency, formatTimeRange } from "@/lib/utils";
import type { DestinationDTO } from "@/types";

export function DestinationModal({
  destination,
  onClose,
  onStart,
  starting,
}: {
  destination: DestinationDTO | null;
  onClose: () => void;
  onStart: (destination: DestinationDTO) => void;
  starting: boolean;
}) {
  const [activeDay, setActiveDay] = useState(1);

  const blueprint = destination?.blueprintData;
  const dayTitles = blueprint?.dayTitles ?? [];
  const dayCount = dayTitles.length || 5;

  const dayActivities = useMemo(
    () => (blueprint?.activities ?? []).filter((a) => a.day === activeDay),
    [blueprint, activeDay]
  );

  const points: MapPoint[] = useMemo(
    () =>
      dayActivities.map((a, i) => ({
        id: `${a.day}-${i}`,
        latitude: a.latitude,
        longitude: a.longitude,
        name: a.name,
        locationName: a.locationName,
        category: a.category,
        order: i + 1,
        time: a.startTime,
      })),
    [dayActivities]
  );

  const estimatedTotal = useMemo(
    () => (blueprint?.activities ?? []).reduce((sum, a) => sum + a.cost, 0),
    [blueprint]
  );

  if (!destination) return null;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={destination.name}
      subtitle={`${destination.country} · ${destination.continent}`}
      footer={
        <>
          <span className="mr-auto hidden text-sm text-muted sm:block">
            No account needed — you can sign up later and keep everything.
          </span>
          <Button variant="secondary" onClick={onClose}>
            Keep browsing
          </Button>
          <Button onClick={() => onStart(destination)} disabled={starting}>
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Start Planning This Trip
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <p className="text-[15px] leading-relaxed text-ink-2">{destination.summary}</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<CalendarDays className="h-4 w-4" />} label="Blueprint" value={`${dayCount} days`} />
          <Stat
            icon={<Wallet className="h-4 w-4" />}
            label="Daily budget"
            value={formatCurrency(destination.avgDailyBudgetLocal || destination.avgDailyBudget, destination.currency)}
          />
          <Stat
            icon={<Wallet className="h-4 w-4" />}
            label="Activities cost"
            value={formatCurrency(estimatedTotal, destination.currency)}
          />
          <Stat icon={<Clock className="h-4 w-4" />} label="Local currency" value={destination.currency} />
        </div>

        <div className="rounded-xl border border-line bg-surface-2 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Best time to go</p>
          <p className="mt-1 text-sm text-ink-2">{destination.bestSeason}</p>
        </div>

        {/* Day picker + the plan for that day, with the map following along. */}
        <div>
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
            {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={
                  "shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition " +
                  (day === activeDay
                    ? "border-accent bg-accent-wash text-accent"
                    : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink")
                }
              >
                Day {day}
              </button>
            ))}
          </div>

          <p className="mb-3 font-display text-lg font-medium">{dayTitles[activeDay - 1] ?? `Day ${activeDay}`}</p>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <ol className="space-y-2">
              {dayActivities.map((activity, i) => {
                const meta = ACTIVITY_CATEGORIES[activity.category];
                return (
                  <li
                    key={`${activity.day}-${i}`}
                    className="flex gap-3 rounded-xl border border-line bg-surface px-3.5 py-3"
                  >
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                      style={{ background: meta.color }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{activity.name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatTimeRange(activity.startTime, activity.endTime)} · {activity.locationName}
                      </p>
                      {activity.notes ? (
                        <p className="mt-1.5 flex gap-1.5 text-xs italic text-ink-2">
                          <Lightbulb className="mt-px h-3 w-3 shrink-0 text-amber" />
                          {activity.notes}
                        </p>
                      ) : null}
                    </div>
                    {activity.cost > 0 ? (
                      <span className="tnum shrink-0 self-start text-xs font-medium text-ink-2">
                        {formatCurrency(activity.cost, destination.currency)}
                      </span>
                    ) : (
                      <Badge tone="sage" className="shrink-0 self-start">Free</Badge>
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="h-64 overflow-hidden rounded-xl border border-line lg:h-auto lg:min-h-[280px]">
              <TripMap points={points} showRoute fallbackCenter={[destination.latitude, destination.longitude]} />
            </div>
          </div>
        </div>

        {blueprint?.seasonalTips?.length ? (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Seasonal tips
            </p>
            <ul className="space-y-1.5">
              {blueprint.seasonalTips.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm text-ink-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        <span className="text-accent">{icon}</span>
        {label}
      </p>
      <p className="tnum mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
