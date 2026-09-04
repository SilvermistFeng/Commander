import { prisma } from "@/lib/prisma";
import { fail, guardTripWrite, loadTrip, ok, readJson } from "@/lib/apiHelpers";
import type { PackingItemDTO } from "@/types";

type Ctx = { params: Promise<{ id: string }> };
type Body = { items?: Partial<PackingItemDTO>[]; title?: string; category?: PackingItemDTO["category"]; isEssential?: boolean };

export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  const body = await readJson<Body>(request);
  if (!body) return fail("Couldn't read that request.");

  const incoming = body.items ?? (body.title ? [{ title: body.title, category: body.category, isEssential: body.isEssential }] : []);
  const named = incoming.filter((i) => i.title?.trim());
  if (named.length === 0) return fail("Nothing to add to the list.");

  // Suggestions get applied in bulk, so skip anything already on the list.
  const existing = await prisma.packingItem.findMany({ where: { tripId: id }, select: { title: true } });
  const seen = new Set(existing.map((i) => i.title.toLowerCase()));
  const fresh = named.filter((i) => !seen.has(i.title!.trim().toLowerCase()));
  if (fresh.length === 0) return ok({ trip: await loadTrip(id) });

  const offset = existing.length;
  await prisma.packingItem.createMany({
    data: fresh.map((item, i) => ({
      tripId: id,
      category: item.category ?? "CLOTHES",
      title: item.title!.trim(),
      isEssential: item.isEssential ?? false,
      isPacked: item.isPacked ?? false,
      sortOrder: offset + i,
    })),
  });

  return ok({ trip: await loadTrip(id) }, 201);
}
