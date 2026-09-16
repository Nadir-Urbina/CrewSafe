"use client";

import { getFirebaseAuth } from "@/lib/firebase/auth";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

/**
 * Admin access is carried by an `admin` custom claim on the Firebase ID token —
 * the same claim Firestore and Storage rules check. Both sign-in paths (magic
 * link and break-glass password) end up with a normal Firebase session, so
 * there is only one notion of "signed in" here.
 */
export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  /** True when signed in via the server password rather than the roster. */
  breakGlass: boolean;
}

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        let claims = (await firebaseUser.getIdTokenResult()).claims;

        // No claim yet — this is the first sign-in for this account, or the
        // roster changed. Ask the server to reconcile it, then re-read the
        // token. Forcing the refresh is what makes the new claim visible.
        if (claims.admin !== true) {
          const res = await fetch("/api/admin/sync-claims", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: await firebaseUser.getIdToken() }),
          });
          const data = await res.json().catch(() => null);

          if (data?.admin === true) {
            claims = (await firebaseUser.getIdTokenResult(true)).claims;
          }
        }

        if (claims.admin === true) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            breakGlass: claims.breakGlass === true,
          });
        } else {
          // Authenticated with Firebase but not an admin — boot them out.
          await signOut(auth);
          setUser(null);
        }
      } catch {
        // Never leave the guard hanging on a network or server failure.
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
