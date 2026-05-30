import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  Auth,
} from "firebase/auth";
import app from "./config";

const EMAIL_LINK_KEY = "crewsafe_signin_email";

// Lazy singleton — avoids calling getAuth() at module scope during SSR
let _auth: Auth | null = null;
export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(app);
  return _auth;
}

export async function loginAdmin(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function logoutAdmin() {
  return signOut(getFirebaseAuth());
}

export async function sendAdminSignInLink(email: string) {
  const actionCodeSettings = {
    url: `${window.location.origin}/login/verify`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(getFirebaseAuth(), email, actionCodeSettings);
  // Persist email so the verify page can complete sign-in without prompting again
  window.localStorage.setItem(EMAIL_LINK_KEY, email);
}

export async function completeSignInWithEmailLink(url: string) {
  const auth = getFirebaseAuth();
  if (!isSignInWithEmailLink(auth, url)) return null;

  let email = window.localStorage.getItem(EMAIL_LINK_KEY);
  if (!email) {
    // Fallback: ask the user (handles the case where they opened the link on a different device)
    email = window.prompt("Please enter your email to confirm sign-in") ?? "";
  }
  const result = await signInWithEmailLink(auth, email, url);
  window.localStorage.removeItem(EMAIL_LINK_KEY);
  return result;
}
