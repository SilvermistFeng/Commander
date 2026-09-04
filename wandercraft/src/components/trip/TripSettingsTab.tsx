"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, TriangleAlert } from "lucide-react";
import { Panel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/components/providers/SessionProvider";
import { deleteGuestTrip } from "@/lib/storage";
import { toISODateInput } from "@/lib/utils";
import type { TripOp } from "@/lib/tripClient";
import type { TripDTO, TripVisibility } from "@/types";

const GRADIENTS = [
  { label: "Sunset terracotta", value: "linear-gradient(145deg, #D95338 0%, #E8A33D 50%, #2D5A46 100%)" },
  { label: "Deep forest", value: "linear-gradient(145deg, #2D5A46 0%, #4A8FA8 50%, #1C2124 100%)" },
  { label: "Atlantic blue", value: "linear-gradient(145deg, #2E6F8E 0%, #4A8FA8 45%, #1C2124 100%)" },
  { label: "Desert ochre", value: "linear-gradient(145deg, #C4432B 0%, #E08A5B 45%, #2D5A46 100%)" },
  { label: "Midnight plum", value: "linear-gradient(145deg, #4A3350 0%, #A8577A 50%, #E8A33D 100%)" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "MXN", "ZAR", "TRY", "VND", "NZD", "PEN", "MAD", "ISK", "DKK"];

function formFromTrip(trip: TripDTO) {
  return {
    title: trip.title,
    destinationName: trip.destinationName,
    country: trip.country,
    startDate: toISODateInput(trip.startDate),
    endDate: toISODateInput(trip.endDate),
    totalBudget: String(trip.totalBudget),
    currency: trip.currency,
    coverImage: trip.coverImage ?? GRADIENTS[0].value,
    visibility: trip.visibility,
  };
}

export function TripSettingsTab({
  trip,
  onUpdate,
}: {
  trip: TripDTO;
  onUpdate: (op: TripOp) => Promise<TripDTO | undefined>;
}) {
  const [form, setForm] = useState(() => formFromTrip(trip));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const { push } = useToast();
  const { user } = useSession();
  const router = useRouter();

  // When a change lands from elsewhere (a collaborator, a different tab), pull
  // the fresh values in during render rather than after it.
  const [syncedTrip, setSyncedTrip] = useState(trip);
  if (syncedTrip !== trip) {
    setSyncedTrip(trip);
    setForm(formFromTrip(trip));
  }

  const isOwner = trip.isGuest || trip.ownerId === user?.id;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!form.title.trim()) return setError("Give the trip a title.");
    if (new Date(form.endDate) < new Date(form.startDate)) {
      return setError("The end date is before the start date.");
    }

    setBusy(true);
    const result = await onUpdate({
      kind: "updateTrip",
      patch: {
        title: form.title.trim(),
        destinationName: form.destinationName.trim(),
        country: form.country.trim(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        totalBudget: Number(form.totalBudget) || 0,
        currency: form.currency,
        coverImage: form.coverImage,
        visibility: form.visibility,
      },
    });
    setBusy(false);
    if (result) push("Trip updated.", "success");
  }

  async function deleteTrip() {
    if (trip.isGuest) {
      await deleteGuestTrip(trip.id);
      push("Trip deleted.", "success");
      router.push("/");
      return;
    }
    const res = await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
    if (res.ok) {
      push("Trip deleted.", "success");
      router.push("/trips");
    } else {
      const json = await res.json().catch(() => ({}));
      push(json?.error ?? "Couldn't delete that trip.", "error");
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <Panel className="p-6">
        <h2 className="font-display text-xl font-medium tracking-tight">Trip details</h2>
        <form onSubmit={save} className="mt-5 space-y-4">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Destination">
              <Input
                value={form.destinationName}
                onChange={(e) => setForm((f) => ({ ...f, destinationName: e.target.value }))}
              />
            </Field>
            <Field label="Country">
              <Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </Field>
            <Field label="Ends">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Total budget">
              <Input
                value={form.totalBudget}
                onChange={(e) => setForm((f) => ({ ...f, totalBudget: e.target.value }))}
                inputMode="decimal"
              />
            </Field>
            <Field label="Currency">
              <Select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Cover</p>
            <div className="flex flex-wrap gap-2">
              {GRADIENTS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, coverImage: g.value }))}
                  title={g.label}
                  aria-label={g.label}
                  aria-pressed={form.coverImage === g.value}
                  className={
                    "grain h-12 w-20 rounded-lg border-2 transition " +
                    (form.coverImage === g.value ? "border-accent" : "border-transparent hover:border-line-strong")
                  }
                  style={{ background: g.value }}
                />
              ))}
            </div>
          </div>

          {!trip.isGuest ? (
            <Field label="Who can see this" hint="Shared trips are visible to the people you invite.">
              <Select
                value={form.visibility}
                onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value as TripVisibility }))}
              >
                <option value="PRIVATE">Only me</option>
                <option value="SHARED">People I invite</option>
                <option value="PUBLIC">Anyone with the link</option>
              </Select>
            </Field>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-lg border border-danger/30 bg-danger-wash px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={busy}>
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </form>
      </Panel>

      {isOwner ? (
        <Panel className="border-danger/25 p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-medium tracking-tight text-danger">
            <TriangleAlert className="h-4 w-4" />
            Delete this trip
          </h2>
          <p className="mt-1 text-sm text-ink-2">
            Every activity, document, expense and packing item goes with it. This can&rsquo;t be undone.
          </p>
          {confirmDelete ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="danger" onClick={deleteTrip}>
                <Trash2 className="h-4 w-4" />
                Yes, delete &ldquo;{trip.title}&rdquo;
              </Button>
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Keep it</Button>
            </div>
          ) : (
            <Button variant="danger" className="mt-4" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" />
              Delete trip
            </Button>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
