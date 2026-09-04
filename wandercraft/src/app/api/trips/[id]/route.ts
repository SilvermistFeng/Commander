import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fail, guardTripRead, guardTripWrite, loadTrip, ok, readJson, toDate } from "@/lib/apiHelpers";
import type { TripDTO } from "@/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await guardTripRead(id);
  if ("error" in guard) return guard.error;

  const trip = await loadTrip(id);
  if (!trip) return fail("That trip no longer exists.", 404);
  return ok({ trip });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  const body = await readJson<Partial<TripDTO>>(request);
  if (!body) return fail("Couldn't read that request.");

  const startDate = toDate(body.startDate);
  const endDate = toDate(body.endDate);
  if (startDate && endDate && endDate < startDate) {
    return fail("The end date can't be before the start date.");
  }

  await prisma.trip.update({
    where: { id },
    data: {
      title: body.title?.trim() || undefined,
      destinationName: body.destinationName ?? undefined,
      country: body.country ?? undefined,
      latitude: body.latitude ?? undefined,
      longitude: body.longitude ?? undefined,
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
      coverImage: body.coverImage ?? undefined,
      travelStyle: body.travelStyle ?? undefined,
      totalBudget: body.totalBudget != null ? new Prisma.Decimal(body.totalBudget) : undefined,
      currency: body.currency ?? undefined,
      visibility: body.visibility ?? undefined,
    },
  });

  return ok({ trip: await loadTrip(id) });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  // Only the owner can delete outright; editors can change but not destroy.
  const trip = await prisma.trip.findUnique({ where: { id }, select: { ownerId: true } });
  if (!trip) return fail("That trip no longer exists.", 404);
  if (trip.ownerId !== guard.data.user.id) {
    return fail("Only the trip owner can delete it.", 403);
  }

  await prisma.trip.delete({ where: { id } });
  return ok({ ok: true });
}
