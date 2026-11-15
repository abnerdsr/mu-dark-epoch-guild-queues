import { ok, route } from "@/lib/server/http";
import { getSessionUser, toAuthUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await getSessionUser();
  return ok({ user: user ? toAuthUser(user) : null });
});
