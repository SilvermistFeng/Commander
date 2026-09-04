import { GUEST_PREFIX } from "./guestPrefix";
import { addDays, makeId, toISODateInput } from "./utils";
import type { ActivityDTO, DestinationDTO, PackingItemDTO, TripDTO } from "@/types";

/**
 * Turn a seeded destination blueprint into a real, editable trip.
 *
 * The same function runs in the browser (guest, saved to IndexedDB) and on the
 * server (signed in, saved to Postgres), so a guest who later signs up gets
 * exactly the trip they were already looking at.
 */
export function buildTripFromDestination(
  destination: DestinationDTO,
  options: {
    ownerId: string;
    isGuest: boolean;
    startDate?: Date;
    title?: string;
    tripId?: string;
    ownerName?: string;
    ownerEmail?: string;
  }
): TripDTO {
  const blueprint = destination.blueprintData;
  const dayCount = Math.max(1, blueprint.dayTitles?.length ?? 5);

  // Default to two weeks out: far enough to be plausible, close enough that
  // the weather tab has a real forecast to show.
  const start = options.startDate ?? addDays(new Date(), 14);
  const end = addDays(start, dayCount - 1);

  const tripId = options.tripId ?? (options.isGuest ? makeId(GUEST_PREFIX.replace(/_$/, "")) : makeId("trip"));

  const activities: ActivityDTO[] = (blueprint.activities ?? []).map((a, index) => ({
    id: makeId("act"),
    tripId,
    dayNumber: a.day,
    startTime: a.startTime,
    endTime: a.endTime,
    category: a.category,
    name: a.name,
    locationName: a.locationName,
    address: null,
    latitude: a.latitude,
    longitude: a.longitude,
    cost: a.cost,
    currency: destination.currency,
    notes: a.notes ?? null,
    bookingStatus: "PLANNED",
    sortOrder: index,
  }));

  // Renumber sortOrder per day rather than across the whole trip.
  const perDay = new Map<number, number>();
  for (const activity of activities) {
    const next = perDay.get(activity.dayNumber) ?? 0;
    activity.sortOrder = next;
    perDay.set(activity.dayNumber, next + 1);
  }

  const packingItems: PackingItemDTO[] = (blueprint.packingHints ?? []).map((hint, i) => ({
    id: makeId("pack"),
    tripId,
    category: "CLOTHES",
    title: hint,
    isPacked: false,
    isEssential: false,
    sortOrder: i,
  }));

  return {
    id: tripId,
    title: options.title ?? `${destination.name} in ${dayCount} days`,
    destinationId: destination.id,
    destinationName: destination.name,
    country: destination.country,
    latitude: destination.latitude,
    longitude: destination.longitude,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    coverImage: destination.heroImage,
    travelStyle: destination.tags[0] ?? null,
    // Local currency, matching the currency the cloned activity costs are in.
    totalBudget: Math.round((destination.avgDailyBudgetLocal || destination.avgDailyBudget) * dayCount),
    currency: destination.currency,
    visibility: "PRIVATE",
    ownerId: options.ownerId,
    isGuest: options.isGuest,
    activities,
    documents: [],
    expenses: [],
    packingItems,
    collaborators: options.ownerEmail
      ? [
          {
            id: makeId("col"),
            tripId,
            userId: options.isGuest ? null : options.ownerId,
            email: options.ownerEmail,
            name: options.ownerName ?? "You",
            role: "OWNER",
            inviteToken: makeId("tok"),
            status: "ACCEPTED",
          },
        ]
      : [],
  };
}

/** A blank trip, for people who'd rather start from nothing. */
export function buildBlankTrip(options: {
  ownerId: string;
  isGuest: boolean;
  title: string;
  destinationName: string;
  country: string;
  startDate: Date;
  endDate: Date;
  currency: string;
  totalBudget: number;
  latitude?: number | null;
  longitude?: number | null;
}): TripDTO {
  const tripId = options.isGuest ? makeId(GUEST_PREFIX.replace(/_$/, "")) : makeId("trip");
  return {
    id: tripId,
    title: options.title,
    destinationId: null,
    destinationName: options.destinationName,
    country: options.country,
    latitude: options.latitude ?? null,
    longitude: options.longitude ?? null,
    startDate: options.startDate.toISOString(),
    endDate: options.endDate.toISOString(),
    coverImage: "linear-gradient(145deg, #D95338 0%, #E8A33D 50%, #2D5A46 100%)",
    travelStyle: null,
    totalBudget: options.totalBudget,
    currency: options.currency,
    visibility: "PRIVATE",
    ownerId: options.ownerId,
    isGuest: options.isGuest,
    activities: [],
    documents: [],
    expenses: [],
    packingItems: [],
    collaborators: [],
  };
}

export { toISODateInput };
