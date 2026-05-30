"use client";

import { loginAdmin, sendAdminSignInLink } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "password" | "email-link";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");

  // Shared
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password mode
  const [password, setPassword] = useState("");

  // Email-link mode
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">CS</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            CrewSafe Admin
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to your administrator account
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
          <button
            type="button"
            onClick={() => switchMode("password")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === "password"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => switchMode("email-link")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === "email-link"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Email Link
          </button>
        </div>

        {/* Password form */}
        {mode === "password" && (
          <form
            onSubmit={handlePasswordSubmit}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold text-sm transition-colors"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        )}

        {/* Email-link form */}
        {mode === "email-link" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {linkSent ? (
              <div className="text-center space-y-3 py-2">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-6 h-6 text-green-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="font-semibold text-slate-900">Check your email</h2>
                <p className="text-sm text-slate-500">
                  We sent a sign-in link to{" "}
                  <span className="font-medium text-slate-700">{email}</span>.
                  Click the link in that email to sign in.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLinkSent(false);
                    setEmail("");
                  }}
                  className="text-sm text-orange-500 hover:underline font-medium"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailLinkSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email-link-email"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email-link-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    placeholder="you@company.com"
                  />
                </div>

                <p className="text-xs text-slate-400">
                  We&apos;ll send a one-time sign-in link to this address. No
                  password needed.
                </p>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold text-sm transition-colors"
                >
                  {loading ? "Sending…" : "Send Sign-in Link"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Crew member link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Not an admin?{" "}
          <a href="/" className="text-orange-500 hover:underline font-medium">
            Go to crew home
          </a>
        </p>
      </div>
    </div>
  );
}
