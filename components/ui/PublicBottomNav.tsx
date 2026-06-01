"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CSSProperties } from "react";

function HomeIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function ListIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>;
}
function TrophyIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10v4a5 5 0 01-10 0zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M9 15h6M10 15v4M14 15v4M8 20h8"/></svg>;
}
function SunIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>;
}

const navItems = [
  { href: "/",             label: "Home",       Icon: HomeIcon,   exact: true },
  { href: "/reports",      label: "My Reports", Icon: ListIcon,   exact: false },
  { href: "/leaderboard",  label: "Leaderboard",Icon: TrophyIcon, exact: false },
  { href: "/heat-illness", label: "Heat Check", Icon: SunIcon,    exact: false },
];

export default function PublicBottomNav() {
  const pathname = usePathname();

  const navStyle: CSSProperties = {
    flexShrink: 0,
    background: "var(--cs-ink)",
    borderTop: "2px solid rgba(255,255,255,0.10)",
    display: "flex",
    paddingBottom: "env(safe-area-inset-bottom)",
  };

  return (
    <nav style={navStyle}>
      {navItems.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        const itemStyle: CSSProperties = {
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 3, paddingTop: 10, paddingBottom: 10,
          color: active ? "var(--cs-hiviz)" : "rgba(255,255,255,0.45)",
          textDecoration: "none", minHeight: 0,
          borderTop: active ? `2.5px solid var(--cs-hiviz)` : "2.5px solid transparent",
          transition: "color .12s",
        };
        const labelStyle: CSSProperties = {
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11,
          letterSpacing: 0.5, textTransform: "uppercase",
        };
        return (
          <Link key={href} href={href} style={itemStyle}>
            <Icon />
            <span style={labelStyle}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
