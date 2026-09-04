"use client";

import { ChevronDown, ChevronUp, Pencil, Ticket, Trash2, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ACTIVITY_CATEGORIES } from "@/lib/categories";
import { cn, formatCurrency, formatTimeRange } from "@/lib/utils";
import type { ActivityDTO, DocumentDTO } from "@/types";

export function ActivityCard({
  activity,
  index,
  isSelected,
  documents,
  onSelect,
  onEdit,
  onMove,
  onDelete,
  onOpenDocument,
  canMoveUp,
  canMoveDown,
}: {
  activity: ActivityDTO;
  index: number;
  isSelected: boolean;
  documents: DocumentDTO[];
  onSelect: () => void;
  onEdit: () => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  onOpenDocument: (doc: DocumentDTO) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const meta = ACTIVITY_CATEGORIES[activity.category];

  return (
    <article
      onClick={onSelect}
      className={cn(
        "group relative cursor-pointer rounded-xl border bg-surface p-4 transition duration-200",
        isSelected
          ? "border-accent shadow-lift ring-1 ring-accent/25"
          : "border-line shadow-ambient hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift"
      )}
    >
      <div className="flex gap-3.5">
        {/* Order badge, coloured by category — the same number sits on the map pin. */}
        <span
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ background: meta.color }}
          aria-hidden="true"
        >
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <h3 className="text-[15px] font-semibold leading-snug">{activity.name}</h3>
            {activity.bookingStatus === "CONFIRMED" ? (
              <Badge tone="sage">
                <CircleCheck className="h-3 w-3" />
                Confirmed
              </Badge>
            ) : null}
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted">
            {formatTimeRange(activity.startTime, activity.endTime) ? (
              <span className="tnum font-medium text-ink-2">
                {formatTimeRange(activity.startTime, activity.endTime)}
              </span>
            ) : null}
            {activity.locationName ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{activity.locationName}</span>
              </>
            ) : null}
            <span aria-hidden="true">·</span>
            <span>{meta.label}</span>
          </p>

          {activity.notes ? (
            <p className="mt-2 rounded-lg border-l-2 border-amber/50 bg-amber-wash/50 px-2.5 py-1.5 text-[13px] leading-relaxed text-ink-2">
              {activity.notes}
            </p>
          ) : null}

          {/* Linked vouchers — the bridge from the locker into the day. */}
          {documents.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDocument(doc);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal/30 bg-teal-wash px-2 py-1 text-[11px] font-medium text-teal transition hover:border-teal/60 active:scale-[0.98]"
                >
                  <Ticket className="h-3 w-3" />
                  {doc.title}
                  {doc.confirmationCode ? (
                    <span className="tnum opacity-70">#{doc.confirmationCode}</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {activity.cost > 0 ? (
            <span className="tnum text-sm font-semibold">
              {formatCurrency(activity.cost, activity.currency)}
            </span>
          ) : (
            <span className="text-xs text-muted">Free</span>
          )}

          <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <IconButton label="Move earlier" disabled={!canMoveUp} onClick={(e) => { e.stopPropagation(); onMove(-1); }}>
              <ChevronUp className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton label="Move later" disabled={!canMoveDown} onClick={(e) => { e.stopPropagation(); onMove(1); }}>
              <ChevronDown className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton label="Edit activity" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton label="Delete activity" danger onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        </div>
      </div>
    </article>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-md p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent",
        danger && "hover:bg-danger-wash hover:text-danger"
      )}
    >
      {children}
    </button>
  );
}
