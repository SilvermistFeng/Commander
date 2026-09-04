import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { serialiseTrip, TRIP_INCLUDE } from "@/lib/serialise";
import { TripsDashboard } from "@/components/trip/TripsDashboard";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const rows = await prisma.trip.findMany({
    where: {
      OR: [{ ownerId: user.id }, { collaborators: { some: { userId: user.id, status: "ACCEPTED" } } }],
    },
    include: TRIP_INCLUDE,
    orderBy: { startDate: "asc" },
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-medium tracking-tight">Your trips</h1>
          <p className="mt-1 text-[15px] text-ink-2">
            {rows.length === 0
              ? "Nothing planned yet."
              : `${rows.length} ${rows.length === 1 ? "trip" : "trips"}, sorted by departure.`}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink transition hover:bg-accent-hover active:scale-[0.98]"
        >
          Plan a new trip
        </Link>
      </div>

      <TripsDashboard trips={rows.map(serialiseTrip)} />
    </main>
  );
}
