"use client";

import { sendAdminSignInLink, signInWithFallbackToken } from "@/lib/firebase/auth";
import HazardStripe from "@/components/ui/HazardStripe";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


function MailIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--cs-safe)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 12,
  padding: "14px 16px",
  fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 500, color: "var(--cs-ink)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
  letterSpacing: 0.6, textTransform: "uppercase", color: "var(--cs-ink2)", marginBottom: 8,
};

type Mode = "link" | "password";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode]         = useState<Mode>("link");
  const [loading, setLoading]   = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError]       = useState("");
  // null = not yet known. The password option is hidden only when the server
  // explicitly reports it unconfigured; a failed probe leaves it visible.
  const [passwordAvailable, setPasswordAvailable] = useState<boolean | null>(null);

  // Ask the server whether a break-glass password is configured. This is a
  // break-glass path, so it fails OPEN: only an explicit `enabled: false`
  // hides it. Hiding the emergency exit whenever the probe itself fails would
  // remove it in exactly the circumstances it exists for, and leaves no clue
  // as to why — pressing it when misconfigured returns a readable 503 instead.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/fallback-login", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setPasswordAvailable(data === null ? null : Boolean(data.enabled));
      })
      .catch(() => {
        // Leave it visible; the POST will report the real reason.
      });
    return () => { cancelled = true; };
  }, []);

  async function handleSendLink() {
    try {
      await sendAdminSignInLink(email);
      setLinkSent(true);
    } catch {
      setError("Could not send a sign-in link. Check the email address and try again.");
    }
  }

  async function handlePasswordLogin() {
    const res = await fetch("/api/admin/fallback-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.token) {
      setError(data?.error ?? "Could not sign in. Please try again.");
      return;
    }

    // Exchange the custom token for a real Firebase session, so this login
    // carries the same admin claim the security rules check.
    await signInWithFallbackToken(data.token);
    router.replace("/admin");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "password") {
        await handlePasswordLogin();
      } else {
        await handleSendLink();
      }
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setPassword("");
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cs-paper)", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <img src="/hhlAppIcon.png" alt="Hard Hat League" style={{ width: 88, height: 88, borderRadius: 20, boxShadow: "0 6px 0 var(--cs-ink), 0 10px 24px rgba(0,0,0,0.2)" }} />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--cs-ink)", marginTop: 16, lineHeight: 1 }}>
            Hard Hat League
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cs-muted)", marginTop: 4 }}>
            Admin Sign In
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 0 var(--cs-ink)" }}>
          <HazardStripe height={8} />

          <div style={{ padding: "28px 24px 32px" }}>
            {linkSent ? (
              /* ── Success state ── */
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 999, background: "var(--cs-safe-soft)", border: "2px solid var(--cs-safe)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                  <MailIcon />
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "var(--cs-ink)", textTransform: "uppercase", letterSpacing: 0.3 }}>
                  Check your email
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--cs-muted)", marginTop: 10, lineHeight: 1.55 }}>
                  We sent a sign-in link to{" "}
                  <strong style={{ color: "var(--cs-ink)" }}>{email}</strong>.
                  <br />Click it to access the admin dashboard.
                </div>
                <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--cs-paper-deep)", border: "1.5px solid var(--cs-line)", borderRadius: 10 }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-muted)", lineHeight: 1.5 }}>
                    The link expires in <strong style={{ color: "var(--cs-ink)" }}>1 hour</strong> and can only be used once. Check your spam folder if you don&apos;t see it.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setLinkSent(false); setEmail(""); }}
                  style={{ marginTop: 20, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--cs-hiviz-deep)", minHeight: 0 }}
                >
                  Use a different email
                </button>
              </div>
            ) : (
              /* ── Form ── */
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label htmlFor="email" style={labelStyle}>Email address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    style={inputStyle}
                  />
                </div>

                {mode === "password" && (
                  <div>
                    <label htmlFor="password" style={labelStyle}>Password</label>
                    <input
                      id="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={inputStyle}
                    />
                  </div>
                )}

                <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--cs-muted)", margin: 0, lineHeight: 1.55 }}>
                  {mode === "password"
                    ? "Backup sign-in for when email links aren't getting through."
                    : "We'll email you a one-time sign-in link — no password needed."}
                </p>

                {error && (
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--cs-critical)", background: "var(--cs-critical-soft)", border: "1.5px solid var(--cs-critical)", borderRadius: 10, padding: "10px 14px" }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%", height: 58, borderRadius: 12,
                    cursor: loading ? "not-allowed" : "pointer",
                    background: loading ? "var(--cs-paper-deep)" : "var(--cs-hiviz)",
                    color: loading ? "var(--cs-faint)" : "var(--cs-ink)",
                    border: `2.5px solid ${loading ? "var(--cs-line)" : "var(--cs-ink)"}`,
                    boxShadow: loading ? "none" : "0 4px 0 var(--cs-ink)",
                    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20,
                    letterSpacing: 0.6, textTransform: "uppercase",
                  }}
                >
                  {loading
                    ? (mode === "password" ? "Signing in…" : "Sending…")
                    : (mode === "password" ? "Sign In" : "Send Sign-in Link")}
                </button>

                {passwordAvailable !== false && (
                  <button
                    type="button"
                    onClick={() => switchMode(mode === "password" ? "link" : "password")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, minHeight: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--cs-hiviz-deep)" }}
                  >
                    {mode === "password" ? "Use an email link instead" : "Sign in with a password"}
                  </button>
                )}
              </form>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-faint)", marginTop: 24 }}>
          Not an admin?{" "}
          <a href="/" style={{ color: "var(--cs-hiviz-deep)", fontWeight: 700, textDecoration: "none" }}>
            Go to crew home
          </a>
        </p>
      </div>
    </div>
  );
}
