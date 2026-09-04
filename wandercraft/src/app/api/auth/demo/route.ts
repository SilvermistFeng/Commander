import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { fail, ok } from "@/lib/apiHelpers";

const DEMO_EMAIL = "demo@wandercraft.app";

/** One-click sign-in for the seeded demo account. */
export async function POST() {
  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });

  // If the database was never seeded, create the account rather than erroring.
  if (!user) {
    try {
      user = await prisma.user.create({
        data: {
          email: DEMO_EMAIL,
          passwordHash: await hashPassword("demo1234"),
          name: "Alex Rivera",
          username: "alex",
          preferredCurrency: "EUR",
        },
      });
    } catch {
      return fail("The demo account isn't available. Run `npm run db:seed` first.", 503);
    }
  }

  await createSession(user.id);
  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl,
      preferredCurrency: user.preferredCurrency,
      theme: user.theme,
    },
  });
}
