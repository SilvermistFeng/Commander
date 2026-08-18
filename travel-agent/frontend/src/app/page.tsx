"use client";

import { useState } from "react";
import TripForm from "@/components/TripForm";
import ItineraryView from "@/components/ItineraryView";
import {
  planTrip,
  replanTrip,
  type TripRequest,
  type Itinerary,
  type Activity,
} from "@/lib/api";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [alternatives, setAlternatives] = useState<Activity[]>([]);
  const [tripRequest, setTripRequest] = useState<TripRequest | null>(null);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [locked, setLocked] = useState<string[]>([]);

  async function handlePlan(request: TripRequest) {
    setLoading(true);
    setError("");
    setTripRequest(request);
    setExcluded([]);
    setLocked([]);

    try {
      const result = await planTrip(request);
      setItinerary(result.itinerary);
      setAlternatives(result.available_alternatives);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(activityId: string) {
    if (!tripRequest) return;
    setLoading(true);
    setError("");

    const newExcluded = [...excluded, activityId];
    setExcluded(newExcluded);

    try {
      const result = await replanTrip(tripRequest, locked, newExcluded);
      setItinerary(result.itinerary);
      setAlternatives(result.available_alternatives);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Replan failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(activityId: string) {
    if (!tripRequest) return;
    setLoading(true);
    setError("");

    const newLocked = [...locked, activityId];
    setLocked(newLocked);

    try {
      const result = await replanTrip(tripRequest, newLocked, excluded);
      setItinerary(result.itinerary);
      setAlternatives(result.available_alternatives);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Replan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              TripOptimiser
            </h1>
            <p className="text-sm text-slate-500">
              They give you a list. We give you a plan.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Trip planning form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 print:hidden">
          <TripForm onSubmit={handlePlan} loading={loading} />
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && !itinerary && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
            <p className="text-slate-500 mt-3">
              Optimising your itinerary...
            </p>
          </div>
        )}

        {/* Results */}
        {itinerary && (
          <ItineraryView
            itinerary={itinerary}
            alternatives={alternatives}
            onRemoveActivity={handleRemove}
            onAddActivity={handleAdd}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 mt-12 print:hidden">
        <p className="text-center text-sm text-slate-400">
          Built with JARVIS · Portfolio Project · Not financial advice
        </p>
      </footer>
    </main>
  );
}
