import { getSessionUser } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/apiHelpers";
import { persistTripDTO } from "@/lib/persistTrip";
import type { TripDTO } from "@/types";

/**
 * The bridge from guest to account.
 *
 * The browser posts every trip it built while signed out; each one is written
 * into Postgres under the new user, and the response maps the old temporary ids
 * to the new real ones so the page the user is on can redirect without losing
 * their place.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Sign in first, then we can sync your trips.", 401);

  const body = await readJson<{ trips?: TripDTO[] }>(request);
  const trips = body?.trips ?? [];
  if (trips.length === 0) return ok({ synced: 0, idMap: {} });

  const idMap: Record<string, string> = {};
  const failures: string[] = [];

  for (const trip of trips) {
    try {
      idMap[trip.id] = await persistTripDTO(trip, user.id, user.email, user.name);
    } catch (error) {
      failures.push(trip.title);
      console.error("sync-guest failed for", trip.id, error);
    }
  }

  return ok({ synced: Object.keys(idMap).length, idMap, failures });
}
