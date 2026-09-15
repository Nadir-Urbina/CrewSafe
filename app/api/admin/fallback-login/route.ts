import { cookies } from "next/headers";
import {
  FALLBACK_COOKIE,
  cookieOptions,
  createSessionToken,
  fallbackLoginEnabled,
  verifyCredentials,
} from "@/lib/auth/fallbackSession";

export async function POST(request: Request) {
  if (!fallbackLoginEnabled()) {
    return Response.json(
      { error: "Password sign-in is not configured on this server." },
      { status: 503 }
    );
  }

  let email = "";
  let password = "";
  try {
    const body = await request.json();
    email = typeof body?.email === "string" ? body.email : "";
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (!verifyCredentials(email, password)) {
    // Same message for both wrong email and wrong password — don't confirm which exists.
    return Response.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const normalized = email.trim().toLowerCase();
  (await cookies()).set(FALLBACK_COOKIE, createSessionToken(normalized), cookieOptions);

  return Response.json({ email: normalized });
}
