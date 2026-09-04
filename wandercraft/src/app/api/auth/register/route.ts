import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/apiHelpers";
import { slugify } from "@/lib/utils";

type Body = { email?: string; password?: string; name?: string };

export async function POST(request: Request) {
  const body = await readJson<Body>(request);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  const name = body?.name?.trim() || email?.split("@")[0] || "Traveller";

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return fail("That email address doesn't look right.");
  }
  if (password.length < 8) {
    return fail("Passwords need to be at least 8 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail("An account already uses that email. Try signing in instead.", 409);

  // Usernames are public and unique, so add a suffix if the obvious one is taken.
  const base = slugify(name) || "traveller";
  let username = base;
  let suffix = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${suffix++}`;
  }

  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password), name, username },
    select: { id: true, email: true, name: true, username: true, avatarUrl: true, preferredCurrency: true, theme: true },
  });

  await createSession(user.id);
  return ok({ user }, 201);
}
