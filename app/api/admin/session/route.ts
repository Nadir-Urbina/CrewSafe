import { cookies } from "next/headers";
import { FALLBACK_COOKIE, fallbackLoginEnabled, readSessionToken } from "@/lib/auth/fallbackSession";

/** Lets the client rehydrate a break-glass session on load — the cookie itself is httpOnly. */
export async function GET() {
  const token = (await cookies()).get(FALLBACK_COOKIE)?.value;
  const email = readSessionToken(token);

  if (!email) {
    return Response.json({ email: null, enabled: fallbackLoginEnabled() }, { status: 200 });
  }

  return Response.json({ email, enabled: true });
}
