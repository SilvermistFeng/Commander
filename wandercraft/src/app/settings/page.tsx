import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { SettingsView } from "@/components/profile/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
    select: { preferredCurrency: true, unitSystem: true, weekStartDay: true, theme: true },
  });

  return <SettingsView user={user} />;
}
