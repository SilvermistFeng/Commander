import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fail, guardTripWrite, loadTrip, ok, readJson, toDate } from "@/lib/apiHelpers";
import type { DocumentDTO } from "@/types";

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id, docId } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  const body = await readJson<Partial<DocumentDTO>>(request);
  if (!body) return fail("Couldn't read that request.");

  const existing = await prisma.documentVoucher.findFirst({ where: { id: docId, tripId: id } });
  if (!existing) return fail("That document isn't part of this trip.", 404);

  await prisma.documentVoucher.update({
    where: { id: docId },
    data: {
      activityId: body.activityId !== undefined ? body.activityId || null : undefined,
      category: body.category ?? undefined,
      title: body.title?.trim() || undefined,
      provider: body.provider !== undefined ? body.provider : undefined,
      confirmationCode: body.confirmationCode !== undefined ? body.confirmationCode : undefined,
      fileUrl: body.fileUrl !== undefined ? body.fileUrl : undefined,
      fileName: body.fileName !== undefined ? body.fileName : undefined,
      fileSize: body.fileSize !== undefined ? body.fileSize : undefined,
      startDate: body.startDate !== undefined ? toDate(body.startDate) : undefined,
      endDate: body.endDate !== undefined ? toDate(body.endDate) : undefined,
      details: body.details !== undefined ? body.details : undefined,
      cost: body.cost != null ? new Prisma.Decimal(body.cost) : undefined,
      currency: body.currency ?? undefined,
      cancellationDeadline:
        body.cancellationDeadline !== undefined ? toDate(body.cancellationDeadline) : undefined,
      notes: body.notes !== undefined ? body.notes : undefined,
    },
  });

  return ok({ trip: await loadTrip(id) });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id, docId } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  await prisma.documentVoucher.deleteMany({ where: { id: docId, tripId: id } });
  return ok({ trip: await loadTrip(id) });
}
