import { CSSProperties, ReactNode } from "react";
import Link from "next/link";

interface AppHeaderProps {
  title: string;
  sub?: string;
  backHref?: string;
  onBack?: () => void;
  right?: ReactNode;
  accentColor?: string;
}

function ChevronLeft() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export default function AppHeader({
  title,
  sub,
  backHref,
  onBack,
  right,
  accentColor = "var(--cs-hiviz)",
}: AppHeaderProps) {
  const backBtnStyle: CSSProperties = {
    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
    background: "rgba(255,255,255,0.10)",
    border: "1.5px solid rgba(255,255,255,0.18)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
    minHeight: 0,
  };

  return (
    <div style={{ flexShrink: 0, zIndex: 30, background: "var(--cs-ink)" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px 14px",
        paddingTop: "max(14px, env(safe-area-inset-top))",
      }}>
        {(backHref || onBack) && (
          backHref ? (
            <Link href={backHref} style={backBtnStyle}>
              <ChevronLeft />
            </Link>
          ) : (
            <button onClick={onBack} style={backBtnStyle}>
              <ChevronLeft />
            </button>
          )
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 25,
            lineHeight: 1, letterSpacing: 0.3, textTransform: "uppercase",
            color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {title}
          </div>
          {sub && (
            <div style={{
              fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12,
              color: "rgba(255,255,255,0.6)", marginTop: 4,
              letterSpacing: 0.4, textTransform: "uppercase",
            }}>
              {sub}
            </div>
          )}
        </div>

        {right}
      </div>
      <div style={{ height: 4, background: accentColor, flexShrink: 0 }} />
    </div>
  );
}
