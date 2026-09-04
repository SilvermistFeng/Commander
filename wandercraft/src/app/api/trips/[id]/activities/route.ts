import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fail, guardTripWrite, loadTrip, ok, readJson } from "@/lib/apiHelpers";
import type { ActivityDTO } from "@/types";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  const body = await readJson<Partial<ActivityDTO>>(request);
  if (!body?.name?.trim()) return fail("Give the activity a name.");

  const dayNumber = Math.max(1, Number(body.dayNumber) || 1);
  const count = await prisma.itineraryActivity.count({ where: { tripId: id, dayNumber } });

  await prisma.itineraryActivity.create({
    data: {
      tripId: id,
      dayNumber,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
      category: body.category ?? "SIGHTSEEING",
      name: body.name.trim(),
      locationName: body.locationName ?? null,
      address: body.address ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      cost: new Prisma.Decimal(body.cost ?? 0),
      currency: body.currency ?? "USD",
      notes: body.notes ?? null,
      bookingStatus: body.bookingStatus ?? "PLANNED",
      sortOrder: count,
    },
  });

  return ok({ trip: await loadTrip(id) }, 201);
}
