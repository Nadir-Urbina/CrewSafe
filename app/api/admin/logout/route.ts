import { cookies } from "next/headers";
import { FALLBACK_COOKIE } from "@/lib/auth/fallbackSession";

export async function POST() {
  (await cookies()).delete(FALLBACK_COOKIE);
  return Response.json({ ok: true });
}
