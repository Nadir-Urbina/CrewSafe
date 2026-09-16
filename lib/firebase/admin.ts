// Server-only: never import this from a Client Component.
// The Admin SDK bypasses Firestore security rules entirely.
import {
  cert,
  applicationDefault,
  getApps,
  initializeApp,
  App,
  Credential,
} from "firebase-admin/app";
import { ExternalAccountClient } from "google-auth-library";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

const APP_NAME = "hhl-admin";

/**
 * Three ways to authenticate, in order of preference:
 *
 *   1. FIREBASE_SERVICE_ACCOUNT_JSON — a downloaded key. Simplest, but many
 *      orgs disable key creation via the iam.disableServiceAccountKeyCreation
 *      policy, in which case use (2).
 *   2. Application Default Credentials. Automatic on Google infrastructure
 *      (Cloud Run, App Hosting); locally it comes from
 *      `gcloud auth application-default login`. Minting custom tokens
 *      additionally needs FIREBASE_SERVICE_ACCOUNT_ID, which lets the SDK sign
 *      through the IAM signBlob API instead of a local private key.
 *   3. The emulator, which needs no credentials at all.
 */
function loadCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;

  const json = raw.startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");

  const parsed = JSON.parse(json);
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is missing project_id, client_email, or private_key."
    );
  }

  return cert({
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    // Escaped newlines survive env-var round-tripping; real ones pass through.
    privateKey: parsed.private_key.replace(/\\n/g, "\n"),
  });
}

/** True when pointed at the local Auth emulator, which needs no real key. */
function usingEmulator() {
  return Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
}

/**
 * Enough credentials to verify tokens and write custom claims. This covers
 * Application Default Credentials, which on Google infrastructure are present
 * without any environment variable at all.
 */
/**
 * Workload Identity Federation, as used on Vercel. VERCEL_OIDC_TOKEN is minted
 * per deployment and short-lived, so it is read on each call rather than
 * captured once at startup.
 */
function workloadIdentityCredential(): Credential | null {
  const audience = process.env.GCP_WORKLOAD_IDENTITY_AUDIENCE?.trim();
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_ID?.trim();
  if (!audience || !serviceAccount || !process.env.VERCEL_OIDC_TOKEN) return null;

  const client = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url:
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:generateAccessToken`,
    subject_token_supplier: {
      getSubjectToken: async () => process.env.VERCEL_OIDC_TOKEN ?? "",
    },
  });

  if (!client) return null;

  return {
    async getAccessToken() {
      const { token } = await client.getAccessToken();
      if (!token) throw new Error("Workload identity exchange returned no access token.");
      const expiry = client.credentials.expiry_date;
      return {
        access_token: token,
        expires_in: expiry ? Math.max(0, Math.floor((expiry - Date.now()) / 1000)) : 3600,
      };
    },
  };
}

function usingWorkloadIdentity() {
  return Boolean(
    process.env.GCP_WORKLOAD_IDENTITY_AUDIENCE &&
      process.env.FIREBASE_SERVICE_ACCOUNT_ID &&
      process.env.VERCEL_OIDC_TOKEN
  );
}

export function adminSdkAvailable() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.FIREBASE_SERVICE_ACCOUNT_ID ||
      usingWorkloadIdentity() ||
      usingEmulator()
  );
}

/**
 * Minting a custom token means signing a JWT, which a plain user credential
 * cannot do. That needs a private key, or a service account to impersonate
 * (via the IAM signBlob API).
 */
export function canMintCustomTokens() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.FIREBASE_SERVICE_ACCOUNT_ID ||
      usingEmulator()
  );
}

function adminApp(): App {
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) return existing;

  const serviceAccountId = process.env.FIREBASE_SERVICE_ACCOUNT_ID?.trim();
  const credential = loadCredential() ?? workloadIdentityCredential();

  return initializeApp(
    {
      credential: credential ?? (usingEmulator() ? undefined : applicationDefault()),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      // Without a private key, the SDK signs custom tokens by impersonating
      // this service account through the IAM API.
      ...(serviceAccountId && !credential ? { serviceAccountId } : {}),
    },
    APP_NAME
  );
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}

/** Reads the one source of truth: an active employee with role "admin". */
export async function isAdminEmail(email: string): Promise<boolean> {
  const snap = await adminDb()
    .collection("employees")
    .where("email", "==", email.trim().toLowerCase())
    .where("role", "==", "admin")
    .where("active", "==", true)
    .limit(1)
    .get();

  return !snap.empty;
}

/**
 * Brings the `admin` custom claim in line with the employees collection.
 * Returns whether the user should be treated as an admin.
 */
export async function syncAdminClaim(uid: string, email: string): Promise<boolean> {
  const shouldBeAdmin = await isAdminEmail(email);
  const user = await adminAuth().getUser(uid);
  const hasClaim = user.customClaims?.admin === true;

  if (shouldBeAdmin !== hasClaim) {
    // Preserve any unrelated claims rather than clobbering the whole object.
    const { admin: _drop, ...rest } = user.customClaims ?? {};
    await adminAuth().setCustomUserClaims(uid, shouldBeAdmin ? { ...rest, admin: true } : rest);
  }

  return shouldBeAdmin;
}
