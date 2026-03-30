"use client";

import type { Itinerary, Activity } from "@/lib/api";
import ActivityCard from "./ActivityCard";

interface ItineraryViewProps {
  itinerary: Itinerary;
  alternatives: Activity[];
  onRemoveActivity: (id: string) => void;
  onAddActivity: (id: string) => void;
}

export default function ItineraryView({
  itinerary,
  alternatives,
  onRemoveActivity,
  onAddActivity,
}: ItineraryViewProps) {
  const { trip_request: req } = itinerary;

  return (
    <div className="space-y-6">
      {/* Trip summary header */}
      <div className="bg-blue-600 text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold">
          {req.city}{req.country ? `, ${req.country}` : ""}
        </h2>
        <p className="text-blue-100 mt-1">
          {req.start_date} → {req.end_date} · {itinerary.days.length} days
        </p>
        <div className="flex gap-6 mt-4 text-sm">
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
      </div>

      {/* Day-by-day itinerary */}
      {itinerary.days.map((day) => (
        <div key={day.day_number} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">
                Day {day.day_number}
              </h3>
              <p className="text-sm text-slate-500">{day.date}</p>
            </div>
            <div className="text-sm text-slate-500 text-right">
              <span>💰 {req.currency} {day.total_cost.toFixed(0)}</span>
              <span className="ml-3">🚶 {day.total_travel_minutes}min travel</span>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {day.activities.length === 0 ? (
              <p className="text-slate-400 text-sm italic">
                No activities planned for this day.
              </p>
            ) : (
              day.activities.map((activity, i) => (
                <div key={activity.id}>
                  {i > 0 && (
                    <div className="flex items-center gap-2 py-1 px-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-xs text-slate-400">↓</span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                  )}
                  <ActivityCard
                    activity={activity}
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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
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
