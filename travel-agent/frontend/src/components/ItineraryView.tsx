"use client";

import { useState } from "react";
import {
  downloadItineraryCalendar,
  type Activity,
  type DayPlan,
  type Itinerary,
} from "@/lib/api";
import ActivityCard from "./ActivityCard";

interface ItineraryViewProps {
  itinerary: Itinerary;
  alternatives: Activity[];
  onRemoveActivity: (id: string) => void;
  onAddActivity: (id: string) => void;
}

/** "2026-09-01" → "Tue 1 Sep" */
function formatDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** When the day starts and finishes, e.g. "09:00 – 18:45" */
function dayWindow(day: DayPlan): string {
  if (day.items.length === 0) return "";
  const first = day.items[0].start_time.slice(0, 5);
  const last = day.items[day.items.length - 1].end_time.slice(0, 5);
  return `${first} – ${last}`;
}

export default function ItineraryView({
  itinerary,
  alternatives,
  onRemoveActivity,
  onAddActivity,
}: ItineraryViewProps) {
  const { trip_request: req } = itinerary;
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  async function handleExport() {
    setExporting(true);
    setExportError("");
    try {
      await downloadItineraryCalendar(itinerary);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Calendar export failed"
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Trip summary header */}
      <div className="bg-blue-600 text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold">
          {req.city}{req.country ? `, ${req.country}` : ""}
        </h2>
        <p className="text-blue-100 mt-1">
          {req.start_date} → {req.end_date} · {itinerary.days.length} days ·{" "}
          {req.pace} pace
        </p>
        <div className="flex flex-wrap gap-6 mt-4 text-sm">
          <div>
            <span className="text-blue-200">Budget</span>
            <p className="text-lg font-semibold">
              {req.currency} {req.budget.toFixed(0)}
            </p>
          </div>
          <div>
            <span className="text-blue-200">Planned spend</span>
            <p className="text-lg font-semibold">
              {req.currency} {itinerary.total_cost.toFixed(0)}
            </p>
          </div>
          <div>
            <span className="text-blue-200">Remaining</span>
            <p className="text-lg font-semibold">
              {req.currency} {itinerary.budget_remaining.toFixed(0)}
            </p>
          </div>
          <div>
            <span className="text-blue-200">Activities</span>
            <p className="text-lg font-semibold">
              {itinerary.total_activities}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5 print:hidden">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 text-sm font-semibold bg-white text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-60 transition-colors"
          >
            {exporting ? "Preparing…" : "📅 Add to calendar"}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors"
          >
            🖨️ Print / save as PDF
          </button>
        </div>
      </div>

      {exportError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 print:hidden">
          {exportError}
        </div>
      )}

      {/* Places we were asked for but couldn't find */}
      {itinerary.unmatched_must_include.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4">
          We couldn&apos;t find{" "}
          <strong>{itinerary.unmatched_must_include.join(", ")}</strong> in{" "}
          {req.city}, so they aren&apos;t in your plan. Check the spelling, or
          pick something from the recommendations below.
        </div>
      )}

      {/* Day-by-day itinerary */}
      {itinerary.days.map((day) => (
        <div
          key={day.day_number}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden break-inside-avoid"
        >
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap gap-2 justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">
                Day {day.day_number}
                {dayWindow(day) && (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    {dayWindow(day)}
                  </span>
                )}
              </h3>
              <p className="text-sm text-slate-500">{formatDate(day.date)}</p>
            </div>
            <div className="text-sm text-slate-500 text-right">
              <span>💰 {req.currency} {day.total_cost.toFixed(0)}</span>
              <span className="ml-3">🚶 {day.total_travel_minutes}min travel</span>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {day.items.length === 0 ? (
              <p className="text-slate-400 text-sm italic">
                Nothing planned — a free day to wander.
              </p>
            ) : (
              day.items.map((item, i) => (
                <div key={`${item.activity.id}-${i}`}>
                  {i > 0 && (
                    <div className="flex items-center gap-2 py-1 px-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {item.travel_minutes_from_previous > 0
                          ? `↓ ~${item.travel_minutes_from_previous} min travel`
                          : "↓"}
                      </span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                  )}
                  <ActivityCard
                    activity={item.activity}
                    startTime={item.start_time}
                    endTime={item.end_time}
                    currency={req.currency}
                    onRemove={onRemoveActivity}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      {/* Alternatives section */}
      {alternatives.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden print:hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <h3 className="font-bold text-slate-800">
              Other Recommendations
            </h3>
            <p className="text-sm text-slate-500">
              Add these to your trip — the itinerary will re-optimise automatically.
            </p>
          </div>
          <div className="p-4 space-y-2">
            {alternatives.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                currency={req.currency}
                onAdd={onAddActivity}
                isAlternative
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
