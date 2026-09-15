"use client";

import { logoutAdmin } from "@/lib/firebase/auth";
import { useAuth, AdminUser } from "@/components/providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

function getUserDisplay(user: AdminUser | null) {
  if (!user) return { name: "Admin", initials: "A", email: "", role: "Administrator" };

  let name = user.displayName;
  if (!name && user.email) {
    const local = user.email.split("@")[0];
    name = local.split(/[._\-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
  name = name || user.email || "Admin";

  const parts = name.trim().split(" ").filter(Boolean);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

  return { name, initials, email: user.email ?? "", role: "Administrator" };
}

function ShieldIcon({ active }: { active?: boolean }) {
  return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={active ? "var(--cs-hiviz)" : "rgba(255,255,255,0.55)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>;
}
function ListIcon({ active }: { active?: boolean }) {
  return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={active ? "var(--cs-hiviz)" : "rgba(255,255,255,0.55)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>;
}
function UsersIcon({ active }: { active?: boolean }) {
  return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={active ? "var(--cs-hiviz)" : "rgba(255,255,255,0.55)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
}
function StarIcon({ active }: { active?: boolean }) {
  return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={active ? "var(--cs-hiviz)" : "rgba(255,255,255,0.55)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>;
}
function ThermIcon({ active }: { active?: boolean }) {
  return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={active ? "var(--cs-hiviz)" : "rgba(255,255,255,0.55)"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>;
}
function ArrowRightIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--cs-hiviz)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>;
}
function LogoutIcon() {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>;
}

const navItems = [
  { href: "/admin",                label: "Submissions",  Icon: ListIcon,  exact: true  },
  { href: "/admin/employees",      label: "Employees",    Icon: UsersIcon, exact: false },
  { href: "/admin/rewards",        label: "Rewards",      Icon: StarIcon,  exact: false },
  { href: "/admin/heat-illness",   label: "Heat Program", Icon: ThermIcon, exact: false },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { name, initials, email, role } = getUserDisplay(user);

  async function handleLogout() {
    // Clear both sign-in paths — either one alone would keep the session alive.
    await Promise.allSettled([
      logoutAdmin(),
      fetch("/api/admin/logout", { method: "POST" }),
    ]);
    router.replace("/login");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        width: 232, flexShrink: 0, background: "var(--cs-ink)",
        display: "flex", flexDirection: "column", padding: "22px 14px",
      }}
        className="hidden md:flex"
      >
        {/* Wordmark */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 9 }}>
          <img src="/hhlAppIcon.png" alt="Hard Hat League" style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0 }} />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, lineHeight: 1, letterSpacing: 0.5, color: "#fff", textTransform: "uppercase" }}>
            Hard Hat <span style={{ color: "var(--cs-hiviz)" }}>League</span>
          </div>
        </div>

        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", padding: "0 10px 8px" }}>Safety Admin</div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 12px",
                borderRadius: 11, textDecoration: "none",
                background: active ? "rgba(255,255,255,0.10)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.6)",
                borderLeft: active ? "3px solid var(--cs-hiviz)" : "3px solid transparent",
              }}>
                <Icon active={active} />
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15.5, letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Open field app */}
        <Link href="/" style={{
          marginTop: 14, display: "flex", alignItems: "center", gap: 10, padding: "12px",
          borderRadius: 11, textDecoration: "none",
          background: "transparent", border: "1.5px solid rgba(255,255,255,0.18)",
          color: "rgba(255,255,255,0.8)",
        }}>
          <ArrowRightIcon />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, letterSpacing: 0.4, textTransform: "uppercase" }}>Open Field App</span>
        </Link>

        <div style={{ flex: 1 }} />

        {/* User footer */}
        <div style={{ borderTop: "1.5px solid rgba(255,255,255,0.12)", paddingTop: 14, display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--cs-hiviz-deep)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--cs-ink)", flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14.5, color: "#fff", letterSpacing: 0.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              <span style={{ color: "var(--cs-hiviz)", fontWeight: 600 }}>{role}</span>
              {email && <span style={{ marginLeft: 5, opacity: 0.7 }}>· {email}</span>}
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, minHeight: 0 }}>
            <LogoutIcon />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header style={{ background: "var(--cs-ink)", flexShrink: 0 }} className="flex md:hidden flex-col">
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", paddingTop: "max(12px, env(safe-area-inset-top))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <img src="/hhlAppIcon.png" alt="Hard Hat League" style={{ width: 32, height: 32, borderRadius: 7 }} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "#fff", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Hard Hat <span style={{ color: "var(--cs-hiviz)" }}>League</span>
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.4, marginLeft: 4 }}>Admin</span>
          </div>
          <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.10)", border: "1.5px solid rgba(255,255,255,0.18)", borderRadius: 9, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, minHeight: 0 }}>
            <LogoutIcon />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 0.3 }}>Sign out</span>
          </button>
        </div>
        <div style={{ height: 4, background: "var(--cs-hiviz)" }} />
        {/* Mobile tabs */}
        <div style={{ display: "flex", borderTop: "1.5px solid rgba(255,255,255,0.10)" }}>
          {navItems.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 3, padding: "10px 4px", textDecoration: "none",
                color: active ? "var(--cs-hiviz)" : "rgba(255,255,255,0.45)",
                borderBottom: active ? "2.5px solid var(--cs-hiviz)" : "2.5px solid transparent",
                minHeight: 0,
              }}>
                <Icon active={active} />
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</span>
              </Link>
            );
          })}
        </div>
      </header>
    </>
  );
}
