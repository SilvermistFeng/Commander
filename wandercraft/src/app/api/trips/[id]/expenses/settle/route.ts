import { prisma } from "@/lib/prisma";
import { fail, guardTripWrite, loadTrip, ok, readJson } from "@/lib/apiHelpers";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Record that one person has paid another back. Every unsettled share `from`
 * owes on expenses `to` paid for is marked settled, which is exactly what the
 * "Who owes who" row represents.
 */
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  const body = await readJson<{ from?: string; to?: string }>(request);
  if (!body?.from || !body?.to) return fail("Say who paid whom.");

  await prisma.expenseSplit.updateMany({
    where: {
      participantName: body.from,
      isSettled: false,
      expense: { tripId: id, paidByName: body.to },
    },
    data: { isSettled: true },
  });

  return ok({ trip: await loadTrip(id) });
}
