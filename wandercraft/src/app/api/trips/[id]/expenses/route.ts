import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fail, guardTripWrite, loadTrip, ok, readJson, toDate } from "@/lib/apiHelpers";
import { splitEvenly } from "@/lib/splits";
import type { ExpenseDTO } from "@/types";

type Ctx = { params: Promise<{ id: string }> };
type Body = Partial<ExpenseDTO> & { splitWith?: string[] };

export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  const body = await readJson<Body>(request);
  if (!body?.title?.trim()) return fail("Give the expense a name.");

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return fail("Enter an amount greater than zero.");

  const payer = body.paidByName?.trim() || guard.data.user.name;
  const participants = (body.splitWith?.length ? body.splitWith : [payer]).map((p) => p.trim()).filter(Boolean);

  // Match split participants to real accounts where the names line up, so the
  // settlement table can show avatars and the person can see their own debts.
  const collaborators = await prisma.tripCollaborator.findMany({
    where: { tripId: id },
    include: { user: { select: { id: true, name: true } } },
  });
  const userIdByName = new Map<string, string>();
  for (const c of collaborators) {
    if (c.user) userIdByName.set(c.user.name, c.user.id);
  }

  await prisma.expense.create({
    data: {
      tripId: id,
      activityId: body.activityId || null,
      title: body.title.trim(),
      amount: new Prisma.Decimal(amount),
      currency: body.currency ?? "USD",
      category: body.category ?? "OTHER",
      date: toDate(body.date) ?? new Date(),
      paidById: userIdByName.get(payer) ?? null,
      paidByName: payer,
      splits: {
        create: splitEvenly(amount, participants).map((s) => ({
          userId: userIdByName.get(s.participantName) ?? null,
          participantName: s.participantName,
          splitAmount: new Prisma.Decimal(s.splitAmount),
        })),
      },
    },
  });

  return ok({ trip: await loadTrip(id) }, 201);
}
