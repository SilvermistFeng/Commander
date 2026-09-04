import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { getSessionUser, canEditTrip, canViewTrip } from "./auth";
import { serialiseTrip, TRIP_INCLUDE } from "./serialise";
import type { TripDTO, SessionUser } from "@/types";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Load and serialise a trip in one go — every mutation route returns this. */
export async function loadTrip(tripId: string): Promise<TripDTO | null> {
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: TRIP_INCLUDE });
  return trip ? serialiseTrip(trip) : null;
}

type Guarded = { user: SessionUser; tripId: string };

/**
 * Every write route starts the same way: is there a session, does the trip
 * exist, and is this person allowed to change it?
 */
export async function guardTripWrite(
  tripId: string
): Promise<{ error: NextResponse } | { data: Guarded }> {
  const user = await getSessionUser();
  if (!user) return { error: fail("Please sign in to make changes.", 401) };
  const allowed = await canEditTrip(tripId, user.id);
  if (!allowed) return { error: fail("You don't have edit access to this trip.", 403) };
  return { data: { user, tripId } };
}

export async function guardTripRead(
  tripId: string
): Promise<{ error: NextResponse } | { data: { user: SessionUser | null } }> {
  const user = await getSessionUser();
  const allowed = await canViewTrip(tripId, user?.id ?? null);
  if (!allowed) return { error: fail("This trip isn't shared with you.", 403) };
  return { data: { user } };
}

/** Parse a JSON body, returning null rather than throwing on malformed input. */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function toDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
