import type { Prisma } from "@prisma/client";
import type { TripDTO, DestinationDTO, Blueprint } from "@/types";

/**
 * Prisma hands back Decimal objects and Date objects. The client wants plain
 * numbers and ISO strings, and every component is typed against TripDTO, so
 * everything crossing the wire goes through here.
 */

export const TRIP_INCLUDE = {
  activities: { orderBy: [{ dayNumber: "asc" }, { sortOrder: "asc" }] },
  documents: { orderBy: { createdAt: "desc" } },
  expenses: { include: { splits: true }, orderBy: { date: "desc" } },
  packingItems: { orderBy: { sortOrder: "asc" } },
  collaborators: { include: { user: { select: { name: true, avatarUrl: true } } } },
} satisfies Prisma.TripInclude;

export type TripWithRelations = Prisma.TripGetPayload<{ include: typeof TRIP_INCLUDE }>;

const num = (d: Prisma.Decimal | number | null | undefined) => (d == null ? 0 : Number(d));
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export function serialiseTrip(trip: TripWithRelations): TripDTO {
  return {
    id: trip.id,
    title: trip.title,
    destinationId: trip.destinationId,
    destinationName: trip.destinationName,
    country: trip.country,
    latitude: trip.latitude,
    longitude: trip.longitude,
    startDate: trip.startDate.toISOString(),
    endDate: trip.endDate.toISOString(),
    coverImage: trip.coverImage,
    travelStyle: trip.travelStyle,
    totalBudget: num(trip.totalBudget),
    currency: trip.currency,
    visibility: trip.visibility,
    ownerId: trip.ownerId,
    isGuest: false,
    activities: trip.activities.map((a) => ({
      id: a.id,
      tripId: a.tripId,
      dayNumber: a.dayNumber,
      startTime: a.startTime,
      endTime: a.endTime,
      category: a.category,
      name: a.name,
      locationName: a.locationName,
      address: a.address,
      latitude: a.latitude,
      longitude: a.longitude,
      cost: num(a.cost),
      currency: a.currency,
      notes: a.notes,
      bookingStatus: a.bookingStatus,
      sortOrder: a.sortOrder,
    })),
    documents: trip.documents.map((d) => ({
      id: d.id,
      tripId: d.tripId,
      activityId: d.activityId,
      category: d.category,
      title: d.title,
      provider: d.provider,
      confirmationCode: d.confirmationCode,
      fileUrl: d.fileUrl,
      fileName: d.fileName,
      fileSize: d.fileSize,
      startDate: iso(d.startDate),
      endDate: iso(d.endDate),
      details: d.details,
      cost: num(d.cost),
      currency: d.currency,
      cancellationDeadline: iso(d.cancellationDeadline),
      notes: d.notes,
    })),
    expenses: trip.expenses.map((e) => ({
      id: e.id,
      tripId: e.tripId,
      activityId: e.activityId,
      title: e.title,
      amount: num(e.amount),
      currency: e.currency,
      category: e.category,
      date: e.date.toISOString(),
      paidById: e.paidById,
      paidByName: e.paidByName,
      splits: e.splits.map((s) => ({
        id: s.id,
        expenseId: s.expenseId,
        userId: s.userId,
        participantName: s.participantName,
        splitAmount: num(s.splitAmount),
        isSettled: s.isSettled,
      })),
    })),
    packingItems: trip.packingItems.map((p) => ({
      id: p.id,
      tripId: p.tripId,
      category: p.category,
      title: p.title,
      isPacked: p.isPacked,
      isEssential: p.isEssential,
      sortOrder: p.sortOrder,
    })),
    collaborators: trip.collaborators.map((c) => ({
      id: c.id,
      tripId: c.tripId,
      userId: c.userId,
      email: c.email,
      name: c.user?.name ?? c.email.split("@")[0],
      role: c.role,
      inviteToken: c.inviteToken,
      status: c.status,
    })),
  };
}

type DestinationRow = {
  id: string; slug: string; name: string; country: string; continent: string;
  bestSeason: string; avgDailyBudget: Prisma.Decimal; avgDailyBudgetLocal: Prisma.Decimal;
  currency: string; heroImage: string;
  summary: string; latitude: number; longitude: number; tags: string[];
  blueprintData: Prisma.JsonValue;
};

export function serialiseDestination(d: DestinationRow): DestinationDTO {
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    country: d.country,
    continent: d.continent,
    bestSeason: d.bestSeason,
    avgDailyBudget: num(d.avgDailyBudget),
    avgDailyBudgetLocal: num(d.avgDailyBudgetLocal),
    currency: d.currency,
    heroImage: d.heroImage,
    summary: d.summary,
    latitude: d.latitude,
    longitude: d.longitude,
    tags: d.tags,
    blueprintData: d.blueprintData as unknown as Blueprint,
  };
}
