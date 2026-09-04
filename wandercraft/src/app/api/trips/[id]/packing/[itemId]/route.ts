import { prisma } from "@/lib/prisma";
import { fail, guardTripWrite, loadTrip, ok, readJson } from "@/lib/apiHelpers";
import type { PackingItemDTO } from "@/types";

type Ctx = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id, itemId } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  const body = await readJson<Partial<PackingItemDTO>>(request);
  if (!body) return fail("Couldn't read that request.");

  const existing = await prisma.packingItem.findFirst({ where: { id: itemId, tripId: id } });
  if (!existing) return fail("That item isn't on this trip's list.", 404);

  await prisma.packingItem.update({
    where: { id: itemId },
    data: {
      isPacked: body.isPacked ?? undefined,
      isEssential: body.isEssential ?? undefined,
      title: body.title?.trim() || undefined,
      category: body.category ?? undefined,
    },
  });

  return ok({ trip: await loadTrip(id) });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id, itemId } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  await prisma.packingItem.deleteMany({ where: { id: itemId, tripId: id } });
  return ok({ trip: await loadTrip(id) });
}
