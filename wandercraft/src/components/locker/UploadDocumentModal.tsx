"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_ORDER } from "@/lib/categories";
import { formatFileSize, toISODateInput } from "@/lib/utils";
import { activitiesForDay } from "@/lib/tripMutations";
import type { DocumentCategory, TripDTO } from "@/types";

const MAX_BYTES = 4 * 1024 * 1024;

export type DocumentDraft = {
  category: DocumentCategory;
  title: string;
  provider: string;
  confirmationCode: string;
  activityId: string;
  startDate: string;
  endDate: string;
  details: string;
  cost: string;
  cancellationDeadline: string;
  notes: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
};

const EMPTY: DocumentDraft = {
  category: "ACTIVITY",
  title: "",
  provider: "",
  confirmationCode: "",
  activityId: "",
  startDate: "",
  endDate: "",
  details: "",
  cost: "",
  cancellationDeadline: "",
  notes: "",
  fileUrl: null,
  fileName: null,
  fileSize: null,
};

export function UploadDocumentModal({
  open,
  trip,
  dayCount,
  onClose,
  onSave,
}: {
  open: boolean;
  trip: TripDTO;
  dayCount: number;
  onClose: () => void;
  onSave: (draft: DocumentDraft) => Promise<void>;
}) {
  // Mounted only while open, so this initial value is the reset.
  const [draft, setDraft] = useState<DocumentDraft>(() => ({
    ...EMPTY,
    startDate: toISODateInput(trip.startDate),
  }));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof DocumentDraft>(key: K, value: DocumentDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  /** Files are read into a data URI so the locker works offline, with no upload server. */
  function readFile(file: File) {
    if (file.size > MAX_BYTES) {
      setError(`${file.name} is ${formatFileSize(file.size)}. The limit is 4 MB — try a compressed PDF.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((d) => ({
        ...d,
        fileUrl: String(reader.result),
        fileName: file.name,
        fileSize: file.size,
        title: d.title || file.name.replace(/\.[^.]+$/, ""),
      }));
      setError(null);
    };
    reader.onerror = () => setError("Couldn't read that file. Try a different one.");
    reader.readAsDataURL(file);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError("Give the document a title so you can find it later.");
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

  // Every activity across the trip, grouped by day, so a ticket can be pinned
  // to the exact moment it's needed.
  const activityOptions = Array.from({ length: dayCount }, (_, i) => i + 1).flatMap((day) =>
    activitiesForDay(trip, day).map((a) => ({
      id: a.id,
      label: `Day ${day}${a.startTime ? ` · ${a.startTime}` : ""} — ${a.name}`,
    }))
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a document"
      subtitle="Tickets, hotel vouchers, boarding passes, visas — anything you'd panic without."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>Add to locker</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Type">
          <Select value={draft.category} onChange={(e) => set("category", e.target.value as DocumentCategory)}>
            {DOCUMENT_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>{DOCUMENT_CATEGORIES[c].label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Title">
          <Input
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Louvre Museum entry"
            autoFocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Provider">
            <Input
              value={draft.provider}
              onChange={(e) => set("provider", e.target.value)}
              placeholder="GetYourGuide"
            />
          </Field>
          <Field label="Confirmation code">
            <Input
              value={draft.confirmationCode}
              onChange={(e) => set("confirmationCode", e.target.value)}
              placeholder="FR-9982"
            />
          </Field>
        </div>

        {/* File */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Attachment</p>
          {draft.fileUrl ? (
            <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
              <Paperclip className="h-4 w-4 shrink-0 text-teal" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{draft.fileName}</p>
                <p className="text-xs text-muted">{formatFileSize(draft.fileSize)}</p>
              </div>
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, fileUrl: null, fileName: null, fileSize: null }))}
                aria-label="Remove attachment"
                className="rounded-md p-1 text-muted transition hover:bg-surface-3 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface-2 px-3 py-4 text-sm text-muted transition hover:border-accent hover:text-ink"
            >
              <Paperclip className="h-4 w-4" />
              Attach a PDF or photo (up to 4 MB)
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFile(file);
              e.target.value = "";
            }}
          />
        </div>

        <Field label="Link to a moment in the trip" hint="The ticket then appears on that activity's card.">
          <Select value={draft.activityId} onChange={(e) => set("activityId", e.target.value)}>
            <option value="">Not linked to anything</option>
            {activityOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts">
            <Input type="date" value={draft.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
          <Field label="Ends">
            <Input type="date" value={draft.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Free cancellation until" hint="We'll warn you before this passes.">
            <Input
              type="datetime-local"
              value={draft.cancellationDeadline}
              onChange={(e) => set("cancellationDeadline", e.target.value)}
            />
          </Field>
          <Field label={`Cost (${trip.currency})`}>
            <Input
              value={draft.cost}
              onChange={(e) => set("cost", e.target.value)}
              placeholder="0"
              inputMode="decimal"
            />
          </Field>
        </div>

        <Field label="Details" hint="Seat, room type, gate, terminal — whatever you'll be asked for.">
          <Input
            value={draft.details}
            onChange={(e) => set("details", e.target.value)}
            placeholder="Seat 14A · Gate opens 06:20 · Terminal 1"
          />
        </Field>

        <Field label="Notes">
          <Textarea
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Show the QR code at the palace gate, not the park gate."
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
