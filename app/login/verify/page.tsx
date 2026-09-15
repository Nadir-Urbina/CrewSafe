"use client";

import { completeSignInWithEmailLink } from "@/lib/firebase/auth";
import HazardStripe from "@/components/ui/HazardStripe";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus]     = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function verify() {
      try {
        const result = await completeSignInWithEmailLink(window.location.href);
        if (result) {
          setStatus("success");
          setTimeout(() => router.replace("/admin"), 1800);
        } else {
          router.replace("/login");
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Sign-in link is invalid or has expired.");
        setStatus("error");
      }
    }
    verify();
  }, [router]);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cs-paper)", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* Wordmark */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <img src="/hhlAppIcon.png" alt="Hard Hat League" style={{ width: 80, height: 80, borderRadius: 18, boxShadow: "0 6px 0 var(--cs-ink), 0 10px 24px rgba(0,0,0,0.2)" }} />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--cs-ink)", marginTop: 14, lineHeight: 1 }}>
            Hard Hat League
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 0 var(--cs-ink)" }}>
          <HazardStripe height={6} />
          <div style={{ padding: "32px 24px", textAlign: "center" }}>

            {status === "verifying" && (
              <>
                <div style={{ width: 48, height: 48, borderRadius: 999, border: "3.5px solid var(--cs-hiviz)", borderTopColor: "transparent", animation: "cs-spin 0.8s linear infinite", margin: "0 auto 20px" }} />
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--cs-ink)", textTransform: "uppercase", letterSpacing: 0.3 }}>
                  Signing you in…
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--cs-muted)", marginTop: 8 }}>
                  Verifying your sign-in link
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <div style={{ width: 56, height: 56, borderRadius: 999, background: "var(--cs-safe-soft)", border: "2px solid var(--cs-safe)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "cs-pop .4s cubic-bezier(.2,1.2,.3,1)" }}>
                  <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--cs-safe)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12.5l5.5 5.5L20 6"/>
                  </svg>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "var(--cs-ink)", textTransform: "uppercase", letterSpacing: 0.3 }}>
                  You&apos;re in
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--cs-muted)", marginTop: 8 }}>
                  Redirecting to your dashboard…
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div style={{ width: 56, height: 56, borderRadius: 999, background: "var(--cs-critical-soft)", border: "2px solid var(--cs-critical)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="var(--cs-critical)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--cs-ink)", textTransform: "uppercase", letterSpacing: 0.3 }}>
                  Link expired
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--cs-muted)", marginTop: 8, lineHeight: 1.55, maxWidth: 260, margin: "8px auto 0" }}>
                  {errorMsg}
                </div>
                <a href="/login" style={{
                  display: "inline-block", marginTop: 22,
                  fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15,
                  letterSpacing: 0.5, textTransform: "uppercase",
                  color: "var(--cs-ink)", textDecoration: "none",
                  background: "var(--cs-hiviz)", border: "2px solid var(--cs-ink)",
                  borderRadius: 10, padding: "10px 22px",
                  boxShadow: "0 3px 0 var(--cs-ink)",
                }}>
                  Request a new link
                </a>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
