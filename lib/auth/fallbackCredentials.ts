// Server-only: never import this from a Client Component.
import { timingSafeEqual, createHash } from "crypto";

/**
 * Break-glass credentials — a password login for when email links aren't
 * getting through. Verified here, then exchanged for a real Firebase custom
 * token so the resulting session is indistinguishable from a normal one.
 */

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Constant-time compare that tolerates differing input lengths. */
function safeEquals(a: string, b: string) {
  return timingSafeEqual(sha256(a), sha256(b));
}

export function fallbackLoginEnabled() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

export function adminEmail() {
  return (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
}

export function verifyCredentials(email: string, password: string) {
  if (!fallbackLoginEnabled()) return false;
  const emailOk = safeEquals(email.trim().toLowerCase(), adminEmail());
  const passwordOk = safeEquals(password, process.env.ADMIN_PASSWORD as string);
  return emailOk && passwordOk;
}

// ─── Rate limiting ──────────────────────────────────────────────────────────
// In-memory and therefore per-instance: it resets on redeploy and does not span
// serverless instances. Enough to blunt a naive online guessing attack, not a
// substitute for a shared store if this ever needs to hold up properly.

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, number[]>();

export function rateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
    attempts.set(key, recent);
    return { allowed: false, retryAfter };
  }

  recent.push(now);
  attempts.set(key, recent);

  // Opportunistic cleanup so the map can't grow without bound.
  if (attempts.size > 500) {
    for (const [k, v] of attempts) {
      if (v.every((t) => now - t >= WINDOW_MS)) attempts.delete(k);
    }
  }

  return { allowed: true, retryAfter: 0 };
}

export function clearRateLimit(key: string) {
  attempts.delete(key);
}
