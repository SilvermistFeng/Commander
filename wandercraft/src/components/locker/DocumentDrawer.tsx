"use client";

import { useState } from "react";
import { Check, Copy, Download, FileText, Link2, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CancellationPill } from "./CancellationPill";
import { DOCUMENT_CATEGORIES } from "@/lib/categories";
import { formatCurrency, formatDate, formatFileSize } from "@/lib/utils";
import type { TripOp } from "@/lib/tripClient";
import type { DocumentDTO, TripDTO } from "@/types";

export function DocumentDrawer({
  document: doc,
  trip,
  onClose,
  onUpdate,
}: {
  document: DocumentDTO | null;
  trip: TripDTO;
  onClose: () => void;
  onUpdate: (op: TripOp) => Promise<TripDTO | undefined>;
}) {
  const [copied, setCopied] = useState(false);

  if (!doc) return null;

  const linkedActivity = doc.activityId ? trip.activities.find((a) => a.id === doc.activityId) : null;
  const isImage = doc.fileUrl?.startsWith("data:image/");
  const isPdf = doc.fileUrl?.startsWith("data:application/pdf");

  async function copyCode() {
    if (!doc?.confirmationCode) return;
    try {
      await navigator.clipboard.writeText(doc.confirmationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* Clipboard blocked — the code is on screen to read anyway. */
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={doc.title}
      subtitle={doc.provider ?? DOCUMENT_CATEGORIES[doc.category].label}
      footer={
        <>
          {doc.fileUrl ? (
            <a href={doc.fileUrl} download={doc.fileName ?? "voucher"} className="flex-1">
              <Button className="w-full justify-center">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </a>
          ) : null}
          <Button
            variant="danger"
            onClick={async () => {
              await onUpdate({ kind: "deleteDocument", id: doc.id });
              onClose();
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone="teal">{DOCUMENT_CATEGORIES[doc.category].label}</Badge>
          <CancellationPill deadline={doc.cancellationDeadline} />
        </div>

        {/* File preview */}
        {doc.fileUrl ? (
          <div className="overflow-hidden rounded-xl border border-line bg-surface-2">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doc.fileUrl} alt={doc.title} className="max-h-80 w-full object-contain" />
            ) : isPdf ? (
              <object data={doc.fileUrl} type="application/pdf" className="h-80 w-full">
                <p className="p-4 text-sm text-muted">
                  Your browser can&rsquo;t preview PDFs inline. Use Download to open it.
                </p>
              </object>
            ) : (
              <div className="flex items-center gap-3 p-4">
                <FileText className="h-8 w-8 text-muted" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{doc.fileName}</p>
                  <p className="text-xs text-muted">{formatFileSize(doc.fileSize)}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-center">
            <p className="text-sm text-muted">No file attached — the details below are all we have.</p>
          </div>
        )}

        {/* Confirmation code, front and centre because it's what you need at a desk. */}
        {doc.confirmationCode ? (
          <div className="rounded-xl border border-line bg-surface-2 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Confirmation code
            </p>
            <div className="mt-1.5 flex items-center gap-3">
              <code className="tnum flex-1 font-mono text-lg font-semibold tracking-wide">
                {doc.confirmationCode}
              </code>
              <Button variant="secondary" size="sm" onClick={copyCode}>
                {copied ? <Check className="h-3.5 w-3.5 text-sage" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        ) : null}

        <dl className="space-y-3">
          {doc.details ? <Row label="Details" value={doc.details} /> : null}
          {doc.startDate ? <Row label="Starts" value={formatDate(doc.startDate, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} /> : null}
          {doc.endDate ? <Row label="Ends" value={formatDate(doc.endDate, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} /> : null}
          {doc.cancellationDeadline ? (
            <Row
              label="Free cancellation until"
              value={formatDate(doc.cancellationDeadline, {
                weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              })}
            />
          ) : null}
          {doc.cost > 0 ? <Row label="Cost" value={formatCurrency(doc.cost, doc.currency)} /> : null}
          {doc.notes ? <Row label="Notes" value={doc.notes} /> : null}
        </dl>

        {linkedActivity ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-teal/25 bg-teal-wash px-3.5 py-3">
            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            <p className="text-sm text-ink-2">
              Pinned to <strong className="font-semibold text-ink">{linkedActivity.name}</strong> on day{" "}
              {linkedActivity.dayNumber}
              {linkedActivity.startTime ? ` at ${linkedActivity.startTime}` : ""}.
            </p>
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
      <dt className="w-32 shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-sm text-ink-2">{value}</dd>
    </div>
  );
}
