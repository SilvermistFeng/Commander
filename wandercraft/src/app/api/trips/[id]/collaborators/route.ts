import { prisma } from "@/lib/prisma";
import { fail, guardTripWrite, loadTrip, ok, readJson } from "@/lib/apiHelpers";
import { makeId } from "@/lib/utils";
import type { CollaboratorRole } from "@/types";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  const guard = await guardTripWrite(id);
  if ("error" in guard) return guard.error;

  const body = await readJson<{ email?: string; role?: CollaboratorRole }>(request);
  const email = body?.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return fail("That email address doesn't look right.");
  }

  const role: CollaboratorRole = body?.role === "VIEWER" ? "VIEWER" : "EDITOR";
  const invitee = await prisma.user.findUnique({ where: { email } });

  // Re-inviting someone updates their role rather than erroring.
  const collaborator = await prisma.tripCollaborator.upsert({
    where: { tripId_email: { tripId: id, email } },
    update: { role },
    create: {
      tripId: id,
      userId: invitee?.id ?? null,
      email,
      role,
      inviteToken: makeId("tok"),
      // Someone who already has an account is added straight away; everyone
      // else stays pending until they open the invite link.
      status: invitee ? "ACCEPTED" : "PENDING",
    },
  });

  // A trip with anyone else on it is no longer private.
  await prisma.trip.update({ where: { id }, data: { visibility: "SHARED" } });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return ok(
    {
      trip: await loadTrip(id),
      inviteUrl: `${base}/trips/${id}?invite=${collaborator.inviteToken}&role=${role.toLowerCase()}`,
    },
    201
  );
}
