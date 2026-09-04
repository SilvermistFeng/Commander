import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { fail, loadTrip, ok, readJson } from "@/lib/apiHelpers";
import { serialiseTrip, serialiseDestination, TRIP_INCLUDE } from "@/lib/serialise";
import { buildTripFromDestination } from "@/lib/blueprint";
import { persistTripDTO } from "@/lib/persistTrip";
import { makeId } from "@/lib/utils";
import type { TripDTO } from "@/types";

/** Trips this person owns or has been given access to. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return ok({ trips: [] });

  const trips = await prisma.trip.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { collaborators: { some: { userId: user.id, status: "ACCEPTED" } } },
      ],
    },
    include: TRIP_INCLUDE,
    orderBy: { startDate: "asc" },
  });

  return ok({ trips: trips.map(serialiseTrip) });
}

type Body = {
  trip?: TripDTO;
  destinationSlug?: string;
  title?: string;
  startDate?: string;
};

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Please sign in to save a trip to your account.", 401);

  const body = await readJson<Body>(request);
  if (!body) return fail("Couldn't read that request.");

  // Path 1: persist a whole trip built in the browser as a guest.
  if (body.trip) {
    const id = await persistTripDTO(body.trip, user.id, user.email, user.name);
    return ok({ trip: await loadTrip(id) }, 201);
  }

  // Path 2: start a fresh trip from a destination blueprint.
  if (body.destinationSlug) {
    const destination = await prisma.destination.findUnique({ where: { slug: body.destinationSlug } });
    if (!destination) return fail("We don't have that destination in the catalogue.", 404);

    const draft = buildTripFromDestination(serialiseDestination(destination), {
      ownerId: user.id,
      isGuest: false,
      title: body.title,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      ownerEmail: user.email,
      ownerName: user.name,
    });
    const id = await persistTripDTO(draft, user.id, user.email, user.name);
    return ok({ trip: await loadTrip(id) }, 201);
  }

  // Path 3: an empty trip the user fills in themselves.
  const start = body.startDate ? new Date(body.startDate) : new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 4);

  const created = await prisma.trip.create({
    data: {
      title: body.title?.trim() || "Untitled trip",
      destinationName: "Somewhere new",
      country: "",
      startDate: start,
      endDate: end,
      coverImage: "linear-gradient(145deg, #D95338 0%, #E8A33D 50%, #2D5A46 100%)",
      totalBudget: new Prisma.Decimal(0),
      currency: user.preferredCurrency,
      ownerId: user.id,
      collaborators: {
        create: {
          userId: user.id,
          email: user.email,
          role: "OWNER",
          inviteToken: makeId("tok"),
          status: "ACCEPTED",
        },
      },
    },
  });

  return ok({ trip: await loadTrip(created.id) }, 201);
}
