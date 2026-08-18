"use client";

import type { Activity } from "@/lib/api";

interface ActivityCardProps {
  activity: Activity;
  onRemove?: (id: string) => void;
  onAdd?: (id: string) => void;
  isAlternative?: boolean;
  startTime?: string;
  endTime?: string;
  currency?: string;
}

const TYPE_ICONS: Record<string, string> = {
  attraction: "🏛️",
  restaurant: "🍽️",
  cafe: "☕",
  shopping: "🛍️",
  entertainment: "🎭",
};

/** Turn "09:00:00" into "09:00" */
function clock(value?: string): string {
  return value ? value.slice(0, 5) : "";
}

export default function ActivityCard({
  activity,
  onRemove,
  onAdd,
  isAlternative = false,
  startTime,
  endTime,
  currency = "$",
}: ActivityCardProps) {
  const icon = TYPE_ICONS[activity.activity_type] || "📍";

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${
        isAlternative
          ? "border-dashed border-slate-300 bg-slate-50"
          : "border-slate-200 bg-white"
      }`}
    >
      {startTime ? (
        <div className="w-16 shrink-0 text-right">
          <p className="font-semibold text-slate-800 tabular-nums">
            {clock(startTime)}
          </p>
          <p className="text-xs text-slate-400 tabular-nums">
            {clock(endTime)}
          </p>
        </div>
      ) : (
        <span className="text-2xl">{icon}</span>
      )}

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-slate-800 truncate">
          {startTime && <span className="mr-1">{icon}</span>}
          {activity.name}
        </h4>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 mt-1">
          <span>
            ⭐ {activity.review_score.toFixed(1)}
            <span className="text-xs ml-1">
              ({activity.review_count.toLocaleString()})
            </span>
          </span>
          <span>⏱️ {activity.estimated_minutes}min</span>
          <span>
            💰 {currency} {activity.estimated_cost.toFixed(0)}
          </span>
        </div>
        {activity.address && (
          <p className="text-xs text-slate-400 mt-1 truncate">
            {activity.address}
          </p>
        )}
      </div>

      {onRemove && !isAlternative && (
        <button
          onClick={() => onRemove(activity.id)}
          className="text-sm px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors print:hidden"
          title="Remove from itinerary"
        >
          ✕
        </button>
      )}

      {onAdd && isAlternative && (
        <button
          onClick={() => onAdd(activity.id)}
          className="text-sm px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors print:hidden"
          title="Add to itinerary"
        >
          + Add
        </button>
      )}
    </div>
  );
}
