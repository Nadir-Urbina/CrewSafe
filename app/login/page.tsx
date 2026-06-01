"use client";

import { loginAdmin, sendAdminSignInLink } from "@/lib/firebase/auth";
import HazardStripe from "@/components/ui/HazardStripe";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "password" | "email-link";

function ShieldIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--cs-ink)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setLinkSent(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginAdmin(email, password);
      router.replace("/admin");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendAdminSignInLink(email);
      setLinkSent(true);
    } catch {
      setError("Could not send sign-in link. Check the email address and try again.");
    } finally {
      setLoading(false);
    }
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

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cs-paper)", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: "var(--cs-hiviz)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 0 var(--cs-ink), 0 10px 20px rgba(0,0,0,0.15)",
          }}>
            <ShieldIcon />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--cs-ink)", marginTop: 16, lineHeight: 1 }}>
            CrewSafe
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cs-muted)", marginTop: 4 }}>
            Admin Sign In
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 0 var(--cs-ink)" }}>
          {/* Hazard stripe top */}
          <HazardStripe height={8} />

          <div style={{ padding: "24px 24px 28px" }}>
            {/* Mode toggle */}
            <div style={{ display: "flex", background: "var(--cs-paper-deep)", padding: 4, borderRadius: 12, border: "1.5px solid var(--cs-line)", marginBottom: 24 }}>
              {(["password", "email-link"] as Mode[]).map((m) => {
                const on = mode === m;
                return (
                  <button key={m} type="button" onClick={() => switchMode(m)} style={{
                    flex: 1, height: 40, borderRadius: 9, cursor: "pointer", border: "none",
                    background: on ? "var(--cs-ink)" : "transparent",
                    color: on ? "#fff" : "var(--cs-ink2)",
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14,
                    letterSpacing: 0.4, textTransform: "uppercase",
                    transition: "background .12s",
                    minHeight: 0,
                  }}>
                    {m === "password" ? "Password" : "Email Link"}
                  </button>
                );
              })}
            </div>

            {/* Password form */}
            {mode === "password" && (
              <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label htmlFor="email" style={labelStyle}>Email</label>
                  <input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="password" style={labelStyle}>Password</label>
                  <input id="password" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                </div>
                {error && <ErrorBanner message={error} />}
                <SubmitBtn loading={loading} label="Sign In" loadingLabel="Signing in…" />
              </form>
            )}

            {/* Email-link form */}
            {mode === "email-link" && (
              <div>
                {linkSent ? (
                  <div style={{ textAlign: "center", padding: "12px 0" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 999, background: "var(--cs-safe-soft)", border: "2px solid var(--cs-safe)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="var(--cs-safe)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--cs-ink)", textTransform: "uppercase" }}>Check your email</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--cs-muted)", marginTop: 8, lineHeight: 1.5 }}>
                      We sent a sign-in link to <strong style={{ color: "var(--cs-ink)" }}>{email}</strong>
                    </div>
                    <button type="button" onClick={() => { setLinkSent(false); setEmail(""); }} style={{ marginTop: 16, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--cs-hiviz-deep)", minHeight: 0 }}>
                      Use a different email
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleEmailLinkSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div>
                      <label htmlFor="email-link" style={labelStyle}>Email</label>
                      <input id="email-link" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} />
                    </div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-muted)", margin: 0, lineHeight: 1.5 }}>
                      We&apos;ll send a one-time sign-in link. No password needed.
                    </p>
                    {error && <ErrorBanner message={error} />}
                    <SubmitBtn loading={loading} label="Send Sign-in Link" loadingLabel="Sending…" />
                  </form>
                )}
              </div>
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

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--cs-critical)", background: "var(--cs-critical-soft)", border: "1.5px solid var(--cs-critical)", borderRadius: 10, padding: "10px 14px" }}>
      {message}
    </div>
  );
}

function SubmitBtn({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: "100%", height: 58, borderRadius: 12, cursor: loading ? "not-allowed" : "pointer",
      background: loading ? "var(--cs-paper-deep)" : "var(--cs-hiviz)",
      color: loading ? "var(--cs-faint)" : "var(--cs-ink)",
      border: `2.5px solid ${loading ? "var(--cs-line)" : "var(--cs-ink)"}`,
      boxShadow: loading ? "none" : "0 4px 0 var(--cs-ink)",
      fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20,
      letterSpacing: 0.6, textTransform: "uppercase",
    }}>
      {loading ? loadingLabel : label}
    </button>
  );
}
