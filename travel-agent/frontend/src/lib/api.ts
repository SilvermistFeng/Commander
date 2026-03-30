/**
 * API client — talks to the FastAPI backend.
 *
 * All backend communication goes through this file.
 * If the backend URL changes, update it here — nowhere else.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/** What we send to plan a trip */
export interface TripRequest {
  city: string;
  country: string;
  start_date: string;
  end_date: string;
  budget: number;
  currency: string;
  interests: string[];
}

/** A single activity / place to visit */
export interface Activity {
  id: string;
  name: string;
  activity_type: string;
  latitude: number;
  longitude: number;
  review_score: number;
  review_count: number;
  review_source: string;
  estimated_cost: number;
  estimated_minutes: number;
  address: string;
  description: string;
  photo_url: string;
}

/** One day of the trip */
export interface DayPlan {
  day_number: number;
  date: string;
  activities: Activity[];
  total_cost: number;
  total_travel_minutes: number;
}

/** The complete trip plan */
export interface Itinerary {
  trip_request: TripRequest;
  days: DayPlan[];
  total_cost: number;
  total_activities: number;
  budget_remaining: number;
}

/** What the API returns */
export interface PlanResponse {
  itinerary: Itinerary;
  available_alternatives: Activity[];
}

/** Ask the backend to plan a trip */
export async function planTrip(request: TripRequest): Promise<PlanResponse> {
  const res = await fetch(`${API_BASE}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Server error" }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }

  return res.json();
}

/** Ask the backend to replan after changes */
export async function replanTrip(
  request: TripRequest,
  locked: string[],
  excluded: string[]
): Promise<PlanResponse> {
  const res = await fetch(`${API_BASE}/replan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trip_request: request,
      locked_activity_ids: locked,
      excluded_activity_ids: excluded,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Server error" }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }

  return res.json();
}
