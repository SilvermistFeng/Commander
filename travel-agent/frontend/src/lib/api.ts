/**
 * API client — talks to the FastAPI backend.
 *
 * All backend communication goes through this file.
 * If the backend URL changes, update it here — nowhere else.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/** How full the traveller wants each day to be */
export type Pace = "relaxed" | "balanced" | "packed";

/** What we send to plan a trip */
export interface TripRequest {
  city: string;
  country: string;
  start_date: string;
  end_date: string;
  budget: number;
  currency: string;
  interests: string[];
  must_include: string[];
  pace: Pace;
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

/** An activity with a clock time against it */
export interface ScheduleItem {
  activity: Activity;
  start_time: string;
  end_time: string;
  travel_minutes_from_previous: number;
}

/** One day of the trip */
export interface DayPlan {
  day_number: number;
  date: string;
  items: ScheduleItem[];
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
  unmatched_must_include: string[];
}

/** What the API returns */
export interface PlanResponse {
  itinerary: Itinerary;
  available_alternatives: Activity[];
}

/** A city the backend can plan for */
export interface CityOption {
  city: string;
  country: string;
}

/** Which cities are available, and whether we're on live data */
export interface CitiesResponse {
  mode: "live" | "demo";
  cities: CityOption[];
}

/** Read an error message out of a failed response */
async function toError(res: Response): Promise<Error> {
  const err = await res.json().catch(() => ({ detail: "Server error" }));
  return new Error(err.detail || `API error: ${res.status}`);
}

/** Ask the backend to plan a trip */
export async function planTrip(request: TripRequest): Promise<PlanResponse> {
  const res = await fetch(`${API_BASE}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) throw await toError(res);

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

  if (!res.ok) throw await toError(res);

  return res.json();
}

/** Which cities can we plan for right now? */
export async function fetchCities(): Promise<CitiesResponse> {
  const res = await fetch(`${API_BASE}/cities`);

  if (!res.ok) throw await toError(res);

  return res.json();
}

/**
 * Download the itinerary as a calendar file.
 *
 * The backend builds the file, the browser saves it, and the
 * traveller opens it in Google Calendar, Apple Calendar or Outlook.
 */
export async function downloadItineraryCalendar(
  itinerary: Itinerary
): Promise<void> {
  const res = await fetch(`${API_BASE}/export/ics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(itinerary),
  });

  if (!res.ok) throw await toError(res);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const city = itinerary.trip_request.city.toLowerCase().replace(/\s+/g, "-");

  const link = document.createElement("a");
  link.href = url;
  link.download = `${city}-${itinerary.trip_request.start_date}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
