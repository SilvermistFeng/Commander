import { prisma } from "@/lib/prisma";
import { fail, guardTripWrite, loadTrip, ok, readJson } from "@/lib/apiHelpers";
import type { CollaboratorRole } from "@/types";

type Ctx = { params: Promise<{ id: string; collaboratorId: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id, collaboratorId } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  const body = await readJson<{ role?: CollaboratorRole }>(request);
  if (!body?.role) return fail("Pick a role.");

  const row = await prisma.tripCollaborator.findFirst({ where: { id: collaboratorId, tripId: id } });
  if (!row) return fail("That person isn't on this trip.", 404);
  if (row.role === "OWNER") return fail("The owner's role can't be changed.", 400);

  await prisma.tripCollaborator.update({ where: { id: collaboratorId }, data: { role: body.role } });
  return ok({ trip: await loadTrip(id) });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id, collaboratorId } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  const row = await prisma.tripCollaborator.findFirst({ where: { id: collaboratorId, tripId: id } });
  if (!row) return fail("That person isn't on this trip.", 404);
  if (row.role === "OWNER") return fail("The owner can't be removed from their own trip.", 400);

  await prisma.tripCollaborator.delete({ where: { id: collaboratorId } });
  return ok({ trip: await loadTrip(id) });
}
