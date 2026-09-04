import { getSessionUser } from "@/lib/auth";
import { ok } from "@/lib/apiHelpers";

export async function GET() {
  return ok({ user: await getSessionUser() });
}
