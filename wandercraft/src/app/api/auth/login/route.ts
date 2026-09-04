import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/apiHelpers";

export async function POST(request: Request) {
  const body = await readJson<{ email?: string; password?: string }>(request);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";

  if (!email || !password) return fail("Enter your email and password.");

  const user = await prisma.user.findUnique({ where: { email } });
  // Same message either way, so the form can't be used to discover who has an account.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return fail("That email and password don't match.", 401);
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
