import { adminAuth, canMintCustomTokens } from "@/lib/firebase/admin";
import {
  adminEmail,
  clearRateLimit,
  fallbackLoginEnabled,
  rateLimit,
  verifyCredentials,
} from "@/lib/auth/fallbackCredentials";

/** Tells the login page whether to offer the password option at all. */
export async function GET() {
  // Hidden unless the server can actually complete the exchange.
  return Response.json({ enabled: fallbackLoginEnabled() && canMintCustomTokens() });
}

function clientKey(request: Request) {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  if (!fallbackLoginEnabled()) {
    return Response.json(
      { error: "Password sign-in is not configured on this server." },
      { status: 503 }
    );
  }
  if (!canMintCustomTokens()) {
    return Response.json(
      {
        error:
          "Password sign-in needs either FIREBASE_SERVICE_ACCOUNT_JSON or " +
          "FIREBASE_SERVICE_ACCOUNT_ID to be set on the server.",
      },
      { status: 503 }
    );
  }

  const key = clientKey(request);
  const limit = rateLimit(key);
  if (!limit.allowed) {
    return Response.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
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
    // Same message either way — don't reveal which half was wrong.
    return Response.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  clearRateLimit(key);

  try {
    const auth = adminAuth();
    const target = adminEmail();

    // Reuse the existing account if this email already signed in via magic link,
    // otherwise create one. Either way the uid stays stable across logins.
    let uid: string;
    try {
      uid = (await auth.getUserByEmail(target)).uid;
    } catch (lookupErr) {
      // Only "no such user" justifies creating one. Anything else (network,
      // permissions, bad credentials) must surface rather than be papered over.
      if ((lookupErr as { code?: string })?.code !== "auth/user-not-found") throw lookupErr;
      uid = (await auth.createUser({ email: target, emailVerified: true })).uid;
    }

    // The claim is what Firestore and Storage rules actually check.
    await auth.setCustomUserClaims(uid, { admin: true, breakGlass: true });

    return Response.json({ token: await auth.createCustomToken(uid) });
  } catch (err) {
    console.error("[fallback-login] could not mint custom token:", err);
    return Response.json(
      { error: "Sign-in is temporarily unavailable. Check the server configuration." },
      { status: 500 }
    );
  }
}
