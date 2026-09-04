import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ProfileView } from "@/components/profile/ProfileView";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSessionUser();
  if (!session) redirect("/");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
    select: {
      id: true, email: true, name: true, username: true, avatarUrl: true, bio: true,
      homeCity: true, homeAirport: true, preferredCurrency: true, createdAt: true,
    },
  });

  const [tripCount, activityCount, countries] = await Promise.all([
    prisma.trip.count({ where: { ownerId: user.id } }),
    prisma.itineraryActivity.count({ where: { trip: { ownerId: user.id } } }),
    prisma.trip.findMany({
      where: { ownerId: user.id },
      select: { country: true },
      distinct: ["country"],
    }),
  ]);

  return (
    <ProfileView
      user={{ ...user, createdAt: user.createdAt.toISOString() }}
      stats={{
        trips: tripCount,
        activities: activityCount,
        countries: countries.filter((c) => c.country).length,
      }}
    />
  );
}
