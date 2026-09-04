import { prisma } from "@/lib/prisma";
import { guardTripWrite, loadTrip, ok } from "@/lib/apiHelpers";

type Ctx = { params: Promise<{ id: string; expenseId: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id, expenseId } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  await prisma.expense.deleteMany({ where: { id: expenseId, tripId: id } });
  return ok({ trip: await loadTrip(id) });
}
