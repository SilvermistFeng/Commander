import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/apiHelpers";
import { serialiseDestination } from "@/lib/serialise";

export const revalidate = 3600;

export async function GET() {
  const destinations = await prisma.destination.findMany({ orderBy: { name: "asc" } });
  return ok({ destinations: destinations.map(serialiseDestination) });
}
