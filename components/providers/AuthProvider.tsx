"use client";

import { getFirebaseAuth } from "@/lib/firebase/auth";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db, COLLECTIONS } from "@/lib/firebase/db";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

/**
 * A signed-in admin, from either sign-in path. Firebase's `User` satisfies the
 * email/displayName shape structurally, so both sources flow through unchanged.
 */
export interface AdminUser {
  email: string | null;
  displayName: string | null;
  source: "firebase" | "fallback";
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

async function verifyAdminInFirestore(email: string): Promise<boolean> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.employees),
      where("email", "==", email.toLowerCase()),
      where("role", "==", "admin"),
      where("active", "==", true),
      limit(1)
    )
  );
  return !snap.empty;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<AdminUser | null>(null);
  const [fallbackUser, setFallbackUser] = useState<AdminUser | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [fallbackReady, setFallbackReady] = useState(false);

  // ── Firebase magic-link session ──
  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user?.email) {
        setFirebaseUser(null);
        setFirebaseReady(true);
        return;
      }

      let isValidAdmin = false;
      try {
        isValidAdmin = await verifyAdminInFirestore(user.email);
      } catch {
        // Firestore unreachable — fail closed rather than granting access.
        isValidAdmin = false;
      }

      if (!isValidAdmin) {
        // Authenticated with Firebase but not a valid active admin — boot them out
        await signOut(auth);
        setFirebaseUser(null);
      } else {
        setFirebaseUser({
          email: user.email,
          displayName: user.displayName,
          source: "firebase",
        });
      }

      setFirebaseReady(true);
    });

    return unsubscribe;
  }, []);

  // ── Break-glass password session (httpOnly cookie, verified server-side) ──
  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setFallbackUser(
          data?.email ? { email: data.email, displayName: null, source: "fallback" } : null
        );
      })
      .catch(() => {
        if (!cancelled) setFallbackUser(null);
      })
      .finally(() => {
        if (!cancelled) setFallbackReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Firebase wins when both are present — it's the real account.
  const user = firebaseUser ?? fallbackUser;
  const loading = !firebaseReady || !fallbackReady;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
