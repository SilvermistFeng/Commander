import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { fail, ok } from "@/lib/apiHelpers";

type Ctx = { params: Promise<{ token: string }> };

/** What's behind this invite link, without accepting it yet. */
export async function GET(_request: Request, { params }: Ctx) {
  const { token } = await params;
  const invite = await prisma.tripCollaborator.findUnique({
    where: { inviteToken: token },
    include: { trip: { select: { id: true, title: true, destinationName: true, startDate: true, endDate: true } } },
  });
  if (!invite) return fail("That invite link isn't valid any more.", 404);

  return ok({
    invite: {
      role: invite.role,
      status: invite.status,
      email: invite.email,
      trip: invite.trip,
    },
  });
}

/** Accept the invite, binding it to the signed-in account. */
export async function POST(_request: Request, { params }: Ctx) {
  const { token } = await params;
  const user = await getSessionUser();
  if (!user) return fail("Sign in or create an account to join this trip.", 401);

  const invite = await prisma.tripCollaborator.findUnique({ where: { inviteToken: token } });
  if (!invite) return fail("That invite link isn't valid any more.", 404);

  // Someone already on the trip under a different email shouldn't get a second row.
  const alreadyOn = await prisma.tripCollaborator.findFirst({
    where: { tripId: invite.tripId, userId: user.id, status: "ACCEPTED" },
  });
  if (alreadyOn) return ok({ tripId: invite.tripId, alreadyJoined: true });

  await prisma.tripCollaborator.update({
    where: { id: invite.id },
    data: { userId: user.id, status: "ACCEPTED" },
  });

  return ok({ tripId: invite.tripId, role: invite.role });
}
