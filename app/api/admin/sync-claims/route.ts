import { adminAuth, adminSdkAvailable, syncAdminClaim } from "@/lib/firebase/admin";
import { adminEmail, fallbackLoginEnabled } from "@/lib/auth/fallbackCredentials";

/**
 * Brings a signed-in user's `admin` custom claim in line with the employees
 * collection. The client calls this after a magic-link sign-in, then force
 * refreshes its ID token so the claim reaches Firestore and Storage rules.
 *
 * Granting is driven entirely by server-side data — the caller only proves
 * which account it holds, never what it should be allowed to do.
 */
export async function POST(request: Request) {
  if (!adminSdkAvailable()) {
    return Response.json({ admin: false, error: "admin-sdk-unavailable" }, { status: 503 });
  }

  let idToken = "";
  try {
    const body = await request.json();
    idToken = typeof body?.idToken === "string" ? body.idToken : "";
  } catch {
    return Response.json({ admin: false, error: "invalid-request" }, { status: 400 });
  }

  if (!idToken) {
    return Response.json({ admin: false, error: "missing-token" }, { status: 400 });
  }

  try {
    // checkRevoked: a disabled or signed-out account must not keep its claim.
    const decoded = await adminAuth().verifyIdToken(idToken, true);

    if (!decoded.email) {
      return Response.json({ admin: false, error: "no-email" }, { status: 400 });
    }

    // The break-glass account is authorised by the server password rather than
    // the roster, so it is exempt from reconciliation. Identify it by the
    // configured address, NOT by the breakGlass claim: that claim lives on the
    // user record, so trusting it would let any account that ever used
    // break-glass escape revocation permanently. Clearing ADMIN_EMAIL on the
    // server is what withdraws this exemption.
    if (fallbackLoginEnabled() && decoded.email.toLowerCase() === adminEmail()) {
      return Response.json({ admin: decoded.admin === true, breakGlass: true });
    }

    return Response.json({ admin: await syncAdminClaim(decoded.uid, decoded.email) });
  } catch (err) {
    console.error("[sync-claims] token verification failed:", err);
    return Response.json({ admin: false, error: "invalid-token" }, { status: 401 });
  }
}
