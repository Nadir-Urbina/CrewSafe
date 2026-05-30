"use client";

import { completeSignInWithEmailLink } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function verify() {
      try {
        const result = await completeSignInWithEmailLink(window.location.href);
        if (result) {
          setStatus("success");
          setTimeout(() => router.replace("/admin"), 1500);
        } else {
          // URL was not an email sign-in link — redirect to login
          router.replace("/login");
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Sign-in link is invalid or has expired.";
        setErrorMsg(msg);
        setStatus("error");
      }
    }
    verify();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        {status === "verifying" && (
          <>
            <div className="w-12 h-12 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-slate-600 font-medium">Verifying your sign-in link…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className="w-6 h-6 text-green-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-slate-800 font-semibold">Signed in successfully</p>
            <p className="text-sm text-slate-500">Redirecting to the dashboard…</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-6 h-6 text-red-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-slate-800 font-semibold">Sign-in failed</p>
            <p className="text-sm text-slate-500">{errorMsg}</p>
            <a
              href="/login"
              className="inline-block mt-2 text-sm text-orange-500 hover:underline font-medium"
            >
              Back to sign in
            </a>
          </>
        )}
      </div>
    </div>
  );
}
