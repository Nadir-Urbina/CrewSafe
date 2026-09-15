// Server-only: never import this from a Client Component.
import { createHmac, timingSafeEqual, createHash } from "crypto";

/**
 * Break-glass admin session — a password login that does not depend on Firebase.
 * Only active when ADMIN_EMAIL and ADMIN_PASSWORD are set on the server.
 * Neither value is ever sent to the browser; the client only receives a signed cookie.
 */

export const FALLBACK_COOKIE = "hhl_admin_fallback";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Constant-time compare that tolerates differing input lengths. */
function safeEquals(a: string, b: string) {
  return timingSafeEqual(sha256(a), sha256(b));
}

function secret() {
  // A dedicated secret is preferred, but the password works as one since it
  // never leaves the server and rotating it invalidates old sessions anyway.
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

export function fallbackLoginEnabled() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

export function verifyCredentials(email: string, password: string) {
  if (!fallbackLoginEnabled()) return false;
  const emailOk = safeEquals(
    email.trim().toLowerCase(),
    (process.env.ADMIN_EMAIL as string).trim().toLowerCase()
  );
  const passwordOk = safeEquals(password, process.env.ADMIN_PASSWORD as string);
  return emailOk && passwordOk;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(email: string) {
  const payload = Buffer.from(
    JSON.stringify({ email: email.trim().toLowerCase(), exp: nowSeconds() + SESSION_TTL_SECONDS }),
    "utf8"
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Returns the session email, or null if the token is missing, tampered with, or expired. */
export function readSessionToken(token: string | undefined): string | null {
  if (!token || !fallbackLoginEnabled()) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const { email, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof email !== "string" || typeof exp !== "number") return null;
    if (exp <= nowSeconds()) return null;
    return email;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}
