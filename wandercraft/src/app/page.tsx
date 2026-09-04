import { prisma } from "@/lib/prisma";
import { serialiseDestination } from "@/lib/serialise";
import { Discovery } from "@/components/landing/Discovery";
import { Footer } from "@/components/layout/Footer";
import { DatabaseNotice } from "@/components/layout/DatabaseNotice";
import type { DestinationDTO } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let destinations: DestinationDTO[] = [];
  let dbError: string | null = null;

  try {
    const rows = await prisma.destination.findMany({ orderBy: { name: "asc" } });
    destinations = rows.map(serialiseDestination);
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Unknown database error";
  }

  if (dbError || destinations.length === 0) {
    return <DatabaseNotice error={dbError} />;
  }

  return (
    <main>
      <Discovery destinations={destinations} />
      <Footer />
    </main>
  );
}
