import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fail, guardTripWrite, loadTrip, ok, readJson, toDate } from "@/lib/apiHelpers";
import type { DocumentDTO } from "@/types";

type Ctx = { params: Promise<{ id: string }> };

// Files are stored inline as data URIs. Anything larger belongs in object
// storage, so refuse it clearly rather than blowing up the request body.
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  const body = await readJson<Partial<DocumentDTO>>(request);
  if (!body?.title?.trim()) return fail("Give the document a title.");
  if (body.fileSize && body.fileSize > MAX_FILE_BYTES) {
    return fail("That file is over 4 MB. Try a smaller scan or a PDF export.");
  }

  await prisma.documentVoucher.create({
    data: {
      tripId: id,
      activityId: body.activityId || null,
      category: body.category ?? "ACTIVITY",
      title: body.title.trim(),
      provider: body.provider ?? null,
      confirmationCode: body.confirmationCode ?? null,
      fileUrl: body.fileUrl ?? null,
      fileName: body.fileName ?? null,
      fileSize: body.fileSize ?? null,
      startDate: toDate(body.startDate),
      endDate: toDate(body.endDate),
      details: body.details ?? null,
      cost: new Prisma.Decimal(body.cost ?? 0),
      currency: body.currency ?? "USD",
      cancellationDeadline: toDate(body.cancellationDeadline),
      notes: body.notes ?? null,
    },
  });

  return ok({ trip: await loadTrip(id) }, 201);
}
