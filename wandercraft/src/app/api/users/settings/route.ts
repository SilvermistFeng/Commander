import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/apiHelpers";

type Body = {
  name?: string;
  bio?: string;
  homeCity?: string;
  homeAirport?: string;
  avatarUrl?: string;
  preferredCurrency?: string;
  unitSystem?: "METRIC" | "IMPERIAL";
  weekStartDay?: "MONDAY" | "SUNDAY";
  theme?: "LIGHT" | "DARK" | "SYSTEM";
};

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Please sign in.", 401);

  const body = await readJson<Body>(request);
  if (!body) return fail("Couldn't read that request.");

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: body.name?.trim() || undefined,
      bio: body.bio !== undefined ? body.bio : undefined,
      homeCity: body.homeCity !== undefined ? body.homeCity : undefined,
      homeAirport: body.homeAirport !== undefined ? body.homeAirport : undefined,
      avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : undefined,
      preferredCurrency: body.preferredCurrency ?? undefined,
      unitSystem: body.unitSystem ?? undefined,
      weekStartDay: body.weekStartDay ?? undefined,
      theme: body.theme ?? undefined,
    },
    select: {
      id: true, email: true, name: true, username: true, avatarUrl: true,
      bio: true, homeCity: true, homeAirport: true, preferredCurrency: true,
      unitSystem: true, weekStartDay: true, theme: true,
    },
  });

  return ok({ user: updated });
}
