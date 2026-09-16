import {
  getAuth,
  signInWithCustomToken,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  Auth,
} from "firebase/auth";
import app from "./config";

// Lazy singleton — avoids calling getAuth() at module scope during SSR
let _auth: Auth | null = null;
export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(app);
  return _auth;
}

/**
 * Completes a break-glass sign-in. The server has already checked the password
 * and stamped the admin claim onto the token it minted.
 */
export async function signInWithFallbackToken(customToken: string) {
  return signInWithCustomToken(getFirebaseAuth(), customToken);
}

export async function logoutAdmin() {
  return signOut(getFirebaseAuth());
}

export async function sendAdminSignInLink(email: string) {
  // Encode email in the redirect URL so cross-device sign-in works without a prompt
  const encoded = encodeURIComponent(email);
  const actionCodeSettings = {
    url: `${window.location.origin}/login/verify?email=${encoded}`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(getFirebaseAuth(), email, actionCodeSettings);
}

export async function completeSignInWithEmailLink(url: string) {
  const auth = getFirebaseAuth();
  if (!isSignInWithEmailLink(auth, url)) return null;

  const email = new URL(url).searchParams.get("email") ?? "";

  if (!email) {
    throw new Error("Could not determine your email address. Please request a new sign-in link.");
  }

  return signInWithEmailLink(auth, email, url);
}
