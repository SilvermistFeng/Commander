import { prisma } from "@/lib/prisma";
import { fail, guardTripWrite, loadTrip, ok, readJson } from "@/lib/apiHelpers";

type Ctx = { params: Promise<{ id: string }> };
type Body = { order: { id: string; dayNumber: number; sortOrder: number }[] };

/** Persist a whole day's new ordering in one transaction after a drag or a nudge. */
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  const body = await readJson<Body>(request);
  if (!body?.order?.length) return fail("Nothing to reorder.");

  const validIds = new Set(
    (await prisma.itineraryActivity.findMany({ where: { tripId: id }, select: { id: true } })).map((a) => a.id)
  );

  await prisma.$transaction(
    body.order
      .filter((entry) => validIds.has(entry.id))
      .map((entry) =>
        prisma.itineraryActivity.update({
          where: { id: entry.id },
          data: { dayNumber: Math.max(1, entry.dayNumber), sortOrder: entry.sortOrder },
        })
      )
  );

  return ok({ trip: await loadTrip(id) });
}
