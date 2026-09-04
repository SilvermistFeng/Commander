import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fail, guardTripWrite, loadTrip, ok, readJson } from "@/lib/apiHelpers";
import type { ActivityDTO } from "@/types";

type Ctx = { params: Promise<{ id: string; activityId: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id, activityId } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  const body = await readJson<Partial<ActivityDTO>>(request);
  if (!body) return fail("Couldn't read that request.");

  const existing = await prisma.itineraryActivity.findFirst({ where: { id: activityId, tripId: id } });
  if (!existing) return fail("That activity isn't part of this trip.", 404);

  await prisma.itineraryActivity.update({
    where: { id: activityId },
    data: {
      dayNumber: body.dayNumber != null ? Math.max(1, body.dayNumber) : undefined,
      startTime: body.startTime !== undefined ? body.startTime : undefined,
      endTime: body.endTime !== undefined ? body.endTime : undefined,
      category: body.category ?? undefined,
      name: body.name?.trim() || undefined,
      locationName: body.locationName !== undefined ? body.locationName : undefined,
      address: body.address !== undefined ? body.address : undefined,
      latitude: body.latitude !== undefined ? body.latitude : undefined,
      longitude: body.longitude !== undefined ? body.longitude : undefined,
      cost: body.cost != null ? new Prisma.Decimal(body.cost) : undefined,
      currency: body.currency ?? undefined,
      notes: body.notes !== undefined ? body.notes : undefined,
      bookingStatus: body.bookingStatus ?? undefined,
      sortOrder: body.sortOrder != null ? body.sortOrder : undefined,
    },
  });

  return ok({ trip: await loadTrip(id) });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id, activityId } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  await prisma.itineraryActivity.deleteMany({ where: { id: activityId, tripId: id } });
  return ok({ trip: await loadTrip(id) });
}
