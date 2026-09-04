"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ACTIVITY_CATEGORIES, ACTIVITY_CATEGORY_ORDER } from "@/lib/categories";
import type { ActivityCategory, ActivityDTO, BookingStatus } from "@/types";

export type ActivityDraft = {
  dayNumber: number;
  startTime: string;
  endTime: string;
  category: ActivityCategory;
  name: string;
  locationName: string;
  address: string;
  latitude: string;
  longitude: string;
  cost: string;
  notes: string;
  bookingStatus: BookingStatus;
};

function toDraft(activity: ActivityDTO | null, dayNumber: number): ActivityDraft {
  return {
    dayNumber: activity?.dayNumber ?? dayNumber,
    startTime: activity?.startTime ?? "",
    endTime: activity?.endTime ?? "",
    category: activity?.category ?? "SIGHTSEEING",
    name: activity?.name ?? "",
    locationName: activity?.locationName ?? "",
    address: activity?.address ?? "",
    latitude: activity?.latitude != null ? String(activity.latitude) : "",
    longitude: activity?.longitude != null ? String(activity.longitude) : "",
    cost: activity?.cost ? String(activity.cost) : "",
    notes: activity?.notes ?? "",
    bookingStatus: activity?.bookingStatus ?? "PLANNED",
  };
}

export function ActivityModal({
  open,
  activity,
  dayNumber,
  dayCount,
  currency,
  onClose,
  onSave,
}: {
  open: boolean;
  activity: ActivityDTO | null;
  dayNumber: number;
  dayCount: number;
  currency: string;
  onClose: () => void;
  onSave: (draft: ActivityDraft) => Promise<void>;
}) {
  // The parent mounts this only while it is open, so first-render state is
  // always a fresh draft — no effect needed to reset it.
  const [draft, setDraft] = useState<ActivityDraft>(() => toDraft(activity, dayNumber));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ActivityDraft>(key: K, value: ActivityDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError("Give this activity a name so you recognise it on the timeline.");
      return;
    }
    if (draft.startTime && draft.endTime && draft.endTime < draft.startTime) {
      setError("The end time is before the start time.");
      return;
    }
    setBusy(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={activity ? "Edit activity" : "Add to the day"}
      subtitle={activity ? undefined : "Anything with a place and a time — a meal, a museum, a train."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{activity ? "Save changes" : "Add activity"}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="What is it">
          <Input
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Lunch at Time Out Market"
            autoFocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Day">
            <Select value={draft.dayNumber} onChange={(e) => set("dayNumber", Number(e.target.value))}>
              {Array.from({ length: Math.max(dayCount, draft.dayNumber) }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>Day {d}</option>
              ))}
            </Select>
          </Field>
          <Field label="Category">
            <Select
              value={draft.category}
              onChange={(e) => set("category", e.target.value as ActivityCategory)}
            >
              {ACTIVITY_CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>{ACTIVITY_CATEGORIES[c].label}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts">
            <Input type="time" value={draft.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </Field>
          <Field label="Ends">
            <Input type="time" value={draft.endTime} onChange={(e) => set("endTime", e.target.value)} />
          </Field>
        </div>

        <Field label="Place">
          <Input
            value={draft.locationName}
            onChange={(e) => set("locationName", e.target.value)}
            placeholder="Mercado da Ribeira"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitude" hint="Optional — needed to show it on the map.">
            <Input
              value={draft.latitude}
              onChange={(e) => set("latitude", e.target.value)}
              placeholder="38.7071"
              inputMode="decimal"
            />
          </Field>
          <Field label="Longitude">
            <Input
              value={draft.longitude}
              onChange={(e) => set("longitude", e.target.value)}
              placeholder="-9.1459"
              inputMode="decimal"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Cost (${currency})`}>
            <Input
              value={draft.cost}
              onChange={(e) => set("cost", e.target.value)}
              placeholder="0"
              inputMode="decimal"
            />
          </Field>
          <Field label="Booking">
            <Select
              value={draft.bookingStatus}
              onChange={(e) => set("bookingStatus", e.target.value as BookingStatus)}
            >
              <option value="PLANNED">Just an idea</option>
              <option value="CONFIRMED">Booked and confirmed</option>
            </Select>
          </Field>
        </div>

        <Field label="Notes">
          <Textarea
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Arrive before 8am — by 10 the gates are shoulder to shoulder."
          />
        </Field>

        {error ? (
          <p role="alert" className="rounded-lg border border-danger/30 bg-danger-wash px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
