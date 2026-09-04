"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, FileText, Link2, Paperclip, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Misc";
import { CancellationPill } from "./CancellationPill";
import { DocumentDrawer } from "./DocumentDrawer";
import { UploadDocumentModal, type DocumentDraft } from "./UploadDocumentModal";
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_ORDER } from "@/lib/categories";
import { documentsNeedingAttention } from "@/lib/cancellation";
import { cn, formatCurrency, formatDate, tripDayCount } from "@/lib/utils";
import type { TripOp } from "@/lib/tripClient";
import type { DocumentCategory, DocumentDTO, TripDTO } from "@/types";

export function LockerTab({
  trip,
  onUpdate,
  onGoToActivity,
}: {
  trip: TripDTO;
  onUpdate: (op: TripOp) => Promise<TripDTO | undefined>;
  onGoToActivity: (activityId: string) => void;
}) {
  const [filter, setFilter] = useState<DocumentCategory | "ALL">("ALL");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [openDoc, setOpenDoc] = useState<DocumentDTO | null>(null);

  const visible = useMemo(
    () => (filter === "ALL" ? trip.documents : trip.documents.filter((d) => d.category === filter)),
    [trip.documents, filter]
  );

  const urgent = useMemo(() => documentsNeedingAttention(trip.documents), [trip.documents]);

  const counts = useMemo(() => {
    const map = new Map<DocumentCategory, number>();
    for (const d of trip.documents) map.set(d.category, (map.get(d.category) ?? 0) + 1);
    return map;
  }, [trip.documents]);

  async function saveDocument(draft: DocumentDraft) {
    await onUpdate({
      kind: "addDocument",
      input: {
        activityId: draft.activityId || null,
        category: draft.category,
        title: draft.title.trim(),
        provider: draft.provider.trim() || null,
        confirmationCode: draft.confirmationCode.trim() || null,
        fileUrl: draft.fileUrl,
        fileName: draft.fileName,
        fileSize: draft.fileSize,
        startDate: draft.startDate ? new Date(draft.startDate).toISOString() : null,
        endDate: draft.endDate ? new Date(draft.endDate).toISOString() : null,
        details: draft.details.trim() || null,
        cost: draft.cost ? Number(draft.cost) : 0,
        currency: trip.currency,
        cancellationDeadline: draft.cancellationDeadline
          ? new Date(draft.cancellationDeadline).toISOString()
          : null,
        notes: draft.notes.trim() || null,
      },
    });
  }

  return (
    <>
      {/* Anything with a closing cancellation window gets said out loud, first. */}
      {urgent.length > 0 ? (
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-amber/30 bg-amber-wash px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber" />
          <p className="text-sm text-ink-2">
            <strong className="font-semibold text-ink">
              {urgent.length} booking{urgent.length === 1 ? "" : "s"}
            </strong>{" "}
            {urgent.length === 1 ? "is" : "are"} near the end of free cancellation:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {urgent.slice(0, 3).map(({ doc }) => (
              <button
                key={doc.id}
                onClick={() => setOpenDoc(doc)}
                className="rounded-lg border border-amber/40 bg-surface px-2 py-1 text-xs font-medium text-ink transition hover:border-amber"
              >
                {doc.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")} count={trip.documents.length}>
            All
          </FilterChip>
          {DOCUMENT_CATEGORY_ORDER.map((category) => (
            <FilterChip
              key={category}
              active={filter === category}
              onClick={() => setFilter(category)}
              count={counts.get(category) ?? 0}
            >
              {DOCUMENT_CATEGORIES[category].plural}
            </FilterChip>
          ))}
        </div>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4" />
          Add document
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-7 w-7" />}
          title={filter === "ALL" ? "The locker is empty" : `No ${DOCUMENT_CATEGORIES[filter].plural.toLowerCase()} yet`}
          body="Store tickets, hotel vouchers and boarding passes here, then pin each one to the moment in the day you'll need it."
          action={
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first document
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((doc) => {
            const linked = doc.activityId ? trip.activities.find((a) => a.id === doc.activityId) : null;
            return (
              <article
                key={doc.id}
                onClick={() => setOpenDoc(doc)}
                className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-ambient transition duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge tone="teal">{DOCUMENT_CATEGORIES[doc.category].label}</Badge>
                    <h3 className="mt-2 text-[15px] font-semibold leading-snug">{doc.title}</h3>
                    {doc.provider ? <p className="text-[13px] text-muted">{doc.provider}</p> : null}
                  </div>
                  {doc.fileUrl ? (
                    <Paperclip className="h-4 w-4 shrink-0 text-muted" aria-label="Has an attachment" />
                  ) : null}
                </div>

                {doc.confirmationCode ? (
                  <p className="tnum font-mono text-sm font-medium text-ink-2">#{doc.confirmationCode}</p>
                ) : null}

                {doc.details ? (
                  <p className="line-clamp-2 text-[13px] text-ink-2">{doc.details}</p>
                ) : null}

                <div className="mt-auto space-y-2 border-t border-line pt-3">
                  <CancellationPill deadline={doc.cancellationDeadline} />

                  <div className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="text-muted">
                      {doc.startDate ? formatDate(doc.startDate, { day: "numeric", month: "short" }) : "No date"}
                    </span>
                    {doc.cost > 0 ? (
                      <span className="tnum font-medium">{formatCurrency(doc.cost, doc.currency)}</span>
                    ) : null}
                  </div>

                  {linked ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onGoToActivity(linked.id);
                      }}
                      className="flex w-full items-center gap-1.5 rounded-lg bg-teal-wash px-2 py-1.5 text-left text-[11px] font-medium text-teal transition hover:brightness-95"
                    >
                      <Link2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">Day {linked.dayNumber} · {linked.name}</span>
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {uploadOpen ? (
        <UploadDocumentModal
          open
          trip={trip}
          dayCount={tripDayCount(trip.startDate, trip.endDate)}
          onClose={() => setUploadOpen(false)}
          onSave={saveDocument}
        />
      ) : null}

      <DocumentDrawer document={openDoc} trip={trip} onClose={() => setOpenDoc(null)} onUpdate={onUpdate} />
    </>
  );
}

function FilterChip({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition active:scale-[0.98]",
        active
          ? "border-accent bg-accent text-accent-ink"
          : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink"
      )}
    >
      {children}
      <span className={cn("tnum text-[11px]", active ? "opacity-80" : "text-muted")}>{count}</span>
    </button>
  );
}
