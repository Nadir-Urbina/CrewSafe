import {
  adminAuth,
  canMintCustomTokens,
  isCredentialError,
  resetAdminApp,
} from "@/lib/firebase/admin";
import {
  adminEmail,
  clearRateLimit,
  fallbackLoginEnabled,
  rateLimit,
  verifyCredentials,
} from "@/lib/auth/fallbackCredentials";

// Never cache either handler: the answer depends on server env vars that can
// change between deploys, and a cached "disabled" would hide the break-glass
// option until the next build.
export const dynamic = "force-dynamic";

/** Tells the login page whether to offer the password option at all. */
export async function GET() {
  // Hidden unless the server can actually complete the exchange.
  return Response.json(
    { enabled: fallbackLoginEnabled() && canMintCustomTokens() },
    { headers: { "Cache-Control": "no-store" } }
  );
}

async function mintBreakGlassToken(): Promise<string> {
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
  return auth.createCustomToken(uid);
}

/** Turns an Admin SDK credential failure into something actionable. */
function describeCredentialFailure(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const code = (err as { errorInfo?: { code?: string } })?.errorInfo?.code ?? "";

  if (message.includes("invalid_rapt") || message.includes("invalid_grant")) {
    return process.env.VERCEL
      ? "Server credentials were rejected. Check that OIDC Federation is enabled " +
        "for this Vercel project and that GCP_WORKLOAD_IDENTITY_AUDIENCE matches " +
        "the workload identity provider."
      : "Local Google credentials were rejected. Run `gcloud auth application-default " +
        "login`, then RESTART the dev server — firebase-admin caches the old " +
        "credentials for the life of the process.";
  }

  if (!process.env.VERCEL_OIDC_TOKEN && process.env.VERCEL) {
    return "No Vercel OIDC token was present, so the server has no Google credentials. " +
      "Enable OIDC Federation under Project Settings → Security, then redeploy.";
  }

  if (message.includes("CONFIGURATION_NOT_FOUND")) {
    return "Firebase Authentication is not yet enabled for this project. " +
      "Enable a sign-in provider in the Firebase console first.";
  }

  if (code.includes("permission-denied") || message.includes("PERMISSION_DENIED") ||
      message.includes("iam.serviceAccounts.signBlob")) {
    return "The server identity cannot sign tokens for " +
      `${process.env.FIREBASE_SERVICE_ACCOUNT_ID ?? "the service account"}. ` +
      "It needs roles/iam.serviceAccountTokenCreator on that account.";
  }

  return `Sign-in failed while contacting Google: ${message.split("\n")[0].slice(0, 200)}`;
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
    let token: string;
    try {
      token = await mintBreakGlassToken();
    } catch (err) {
      // Credentials may simply have been refreshed underneath a long-running
      // process. Rebuild the app once and retry before giving up.
      if (!isCredentialError(err)) throw err;
      await resetAdminApp();
      token = await mintBreakGlassToken();
    }
    return Response.json({ token });
  } catch (err) {
    console.error("[fallback-login] could not mint custom token:", err);
    // The caller already proved they know the break-glass password, so an
    // actionable message here leaks nothing to an anonymous attacker — and a
    // generic one would leave the person fixing it with nowhere to start.
    return Response.json({ error: describeCredentialFailure(err) }, { status: 500 });
  }
}
