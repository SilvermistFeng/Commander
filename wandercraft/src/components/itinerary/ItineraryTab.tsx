"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Misc";
import { ActivityCard } from "./ActivityCard";
import { ActivityModal, type ActivityDraft } from "./ActivityModal";
import { DocumentDrawer } from "@/components/locker/DocumentDrawer";
import { TripMap, type MapPoint } from "@/components/map/TripMap";
import { activitiesForDay } from "@/lib/tripMutations";
import { cn, dateForDay, formatCurrency, formatDate } from "@/lib/utils";
import type { TripOp } from "@/lib/tripClient";
import type { ActivityDTO, DocumentDTO, TripDTO } from "@/types";

export function ItineraryTab({
  trip,
  dayCount,
  activeDay,
  onDayChange,
  selectedActivityId,
  onSelectActivity,
  onUpdate,
}: {
  trip: TripDTO;
  dayCount: number;
  activeDay: number;
  onDayChange: (day: number) => void;
  selectedActivityId: string | null;
  onSelectActivity: (id: string | null) => void;
  onUpdate: (op: TripOp) => Promise<TripDTO | undefined>;
}) {
  const [editing, setEditing] = useState<ActivityDTO | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [openDoc, setOpenDoc] = useState<DocumentDTO | null>(null);

  const dayActivities = useMemo(() => activitiesForDay(trip, activeDay), [trip, activeDay]);

  const documentsByActivity = useMemo(() => {
    const map = new Map<string, DocumentDTO[]>();
    for (const doc of trip.documents) {
      if (!doc.activityId) continue;
      map.set(doc.activityId, [...(map.get(doc.activityId) ?? []), doc]);
    }
    return map;
  }, [trip.documents]);

  const points: MapPoint[] = useMemo(
    () =>
      dayActivities
        .filter((a) => a.latitude != null && a.longitude != null)
        .map((a) => ({
          id: a.id,
          latitude: a.latitude!,
          longitude: a.longitude!,
          name: a.name,
          locationName: a.locationName,
          category: a.category,
          order: dayActivities.indexOf(a) + 1,
          time: a.startTime,
        })),
    [dayActivities]
  );

  const dayCost = dayActivities.reduce((sum, a) => sum + a.cost, 0);

  async function saveActivity(draft: ActivityDraft) {
    const parsed = {
      dayNumber: draft.dayNumber,
      startTime: draft.startTime || null,
      endTime: draft.endTime || null,
      category: draft.category,
      name: draft.name.trim(),
      locationName: draft.locationName.trim() || null,
      address: draft.address.trim() || null,
      latitude: draft.latitude ? Number(draft.latitude) : null,
      longitude: draft.longitude ? Number(draft.longitude) : null,
      cost: draft.cost ? Number(draft.cost) : 0,
      currency: trip.currency,
      notes: draft.notes.trim() || null,
      bookingStatus: draft.bookingStatus,
    };

    if (editing) {
      await onUpdate({ kind: "updateActivity", id: editing.id, patch: parsed });
    } else {
      await onUpdate({ kind: "addActivity", input: parsed });
      onDayChange(draft.dayNumber);
    }
  }

  return (
    <>
      {/* Day rail */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => {
          const count = trip.activities.filter((a) => a.dayNumber === day).length;
          const isActive = day === activeDay;
          return (
            <button
              key={day}
              onClick={() => {
                onDayChange(day);
                onSelectActivity(null);
              }}
              className={cn(
                "shrink-0 rounded-xl border px-4 py-2.5 text-left transition active:scale-[0.98]",
                isActive
                  ? "border-accent bg-accent-wash"
                  : "border-line bg-surface hover:border-line-strong hover:-translate-y-0.5"
              )}
            >
              <span className={cn("block text-[13px] font-semibold", isActive ? "text-accent" : "text-ink")}>
                Day {day}
              </span>
              <span className="block text-[11px] text-muted">
                {formatDate(dateForDay(trip.startDate, day), { day: "numeric", month: "short" })}
                {count > 0 ? ` · ${count}` : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,42%)]">
        {/* Timeline */}
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-medium tracking-tight">
                {formatDate(dateForDay(trip.startDate, activeDay), {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h2>
              <p className="mt-0.5 flex items-center gap-2 text-sm text-muted">
                <span>{dayActivities.length} {dayActivities.length === 1 ? "activity" : "activities"}</span>
                {dayCost > 0 ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tnum flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5" />
                      {formatCurrency(dayCost, trip.currency)}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add activity
            </Button>
          </div>

          {dayActivities.length === 0 ? (
            <EmptyState
              icon={<CalendarPlus className="h-7 w-7" />}
              title="Nothing planned for this day"
              body="Add a meal, a museum, or a train and it will appear on the map beside it."
              action={
                <Button
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add the first activity
                </Button>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {dayActivities.map((activity, index) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  index={index}
                  isSelected={activity.id === selectedActivityId}
                  documents={documentsByActivity.get(activity.id) ?? []}
                  canMoveUp={index > 0}
                  canMoveDown={index < dayActivities.length - 1}
                  onSelect={() => onSelectActivity(activity.id === selectedActivityId ? null : activity.id)}
                  onEdit={() => {
                    setEditing(activity);
                    setModalOpen(true);
                  }}
                  onMove={(direction) => onUpdate({ kind: "moveActivity", id: activity.id, direction })}
                  onDelete={() => onUpdate({ kind: "deleteActivity", id: activity.id })}
                  onOpenDocument={setOpenDoc}
                />
              ))}
            </div>
          )}
        </div>

        {/* Map — sticky on desktop so it stays beside whichever card you scroll to. */}
        <div className="lg:sticky lg:top-[8.5rem] lg:h-[calc(100vh-11rem)]">
          <div className="h-[380px] overflow-hidden rounded-2xl border border-line shadow-ambient lg:h-full">
            {points.length > 0 ? (
              <TripMap
                points={points}
                activeId={selectedActivityId}
                onSelect={onSelectActivity}
                showRoute
                fallbackCenter={
                  trip.latitude != null && trip.longitude != null ? [trip.latitude, trip.longitude] : null
                }
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-surface-2 px-6 text-center">
                <p className="max-w-xs text-sm text-muted">
                  Add coordinates to an activity and it will appear here, joined into the day&rsquo;s route.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen ? (
        <ActivityModal
          open
          activity={editing}
          dayNumber={activeDay}
          dayCount={dayCount}
          currency={trip.currency}
          onClose={() => setModalOpen(false)}
          onSave={saveActivity}
        />
      ) : null}

      <DocumentDrawer
        document={openDoc}
        trip={trip}
        onClose={() => setOpenDoc(null)}
        onUpdate={onUpdate}
      />
    </>
  );
}
