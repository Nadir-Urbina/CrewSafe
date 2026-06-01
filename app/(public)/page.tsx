import Link from "next/link";
import HazardStripe from "@/components/ui/HazardStripe";
import BigButton from "@/components/ui/BigButton";

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--cs-ink)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="var(--cs-ink)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cs-faint)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5l7 7-7 7"/>
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--cs-muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"/>
      <circle cx="12" cy="10" r="2.5"/>
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6zM10 19a2 2 0 004 0"/>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cs-hiviz)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>
    </svg>
  );
}

// Days since last lost-time injury — hardcoded until backend is wired
const DAYS_SINCE = 47;
const TODAY_COUNT = 3;
const OPEN_COUNT = 5;

export default function HomePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, background: "var(--cs-ink)",
        paddingTop: "max(18px, env(safe-area-inset-top))", zIndex: 30,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 10, padding: "0 18px 16px",
        }}>
          {/* Wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7, background: "var(--cs-hiviz)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <ShieldIcon />
            </div>
            <div style={{
              fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26,
              lineHeight: 1, letterSpacing: 0.5, color: "#fff", textTransform: "uppercase",
            }}>
              Crew<span style={{ color: "var(--cs-hiviz)" }}>Safe</span>
            </div>
          </div>

          {/* Header actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Link href="/admin" style={{
              height: 42, padding: "0 14px", borderRadius: 11, minHeight: 0,
              background: "rgba(255,255,255,0.10)", border: "1.5px solid rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
            }}>
              <ChartIcon />
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13.5,
                letterSpacing: 0.5, color: "#fff", textTransform: "uppercase",
              }}>Admin</span>
            </Link>
            <button style={{
              width: 42, height: 42, borderRadius: 11, position: "relative", flexShrink: 0,
              background: "rgba(255,255,255,0.10)", border: "1.5px solid rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", minHeight: 0,
            }}>
              <BellIcon />
              <span style={{
                position: "absolute", top: 8, right: 9, width: 8, height: 8,
                borderRadius: 999, background: "var(--cs-critical)",
                border: "1.5px solid var(--cs-ink)",
              }} />
            </button>
          </div>
        </div>
        <div style={{ height: 4, background: "var(--cs-hiviz)" }} />
      </div>

      {/* ── Scrollable content ───────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 18px 100px" }}>

          {/* Location badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <PinIcon />
            <span style={{
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15,
              letterSpacing: 0.6, color: "var(--cs-ink2)", textTransform: "uppercase",
            }}>North Yard · Crew B</span>
            <span style={{
              marginLeft: "auto",
              fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5,
              color: "var(--cs-faint)", textTransform: "uppercase", letterSpacing: 0.4,
            }}>Shared iPad</span>
          </div>

          {/* Days-since hero */}
          <div style={{
            background: "var(--cs-ink)", borderRadius: 18, overflow: "hidden",
            boxShadow: "0 14px 30px rgba(0,0,0,0.16)", marginBottom: 12,
          }}>
            <div style={{ padding: "22px 22px 18px", textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13.5,
                letterSpacing: 2.5, color: "rgba(255,255,255,0.55)", textTransform: "uppercase",
              }}>Days without a</div>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13.5,
                letterSpacing: 2.5, color: "var(--cs-hiviz)", textTransform: "uppercase", marginBottom: 2,
              }}>Lost-time injury</div>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 96,
                lineHeight: 0.95, color: "#fff", letterSpacing: -1,
              }}>{DAYS_SINCE}</div>
              <div style={{
                fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5,
                color: "rgba(255,255,255,0.5)", letterSpacing: 0.4, marginTop: 6,
              }}>Site record: 112 days · Keep it going</div>
            </div>
            <HazardStripe height={9} />
          </div>

          {/* Stat tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[
              { n: TODAY_COUNT, l: "Reports today",  color: "var(--cs-ink)" },
              { n: OPEN_COUNT,  l: "Open on site",   color: "var(--cs-orange)" },
            ].map((t, i) => (
              <div key={i} style={{
                background: "var(--cs-card)", border: "2px solid var(--cs-line)",
                borderRadius: 14, padding: "15px 16px",
              }}>
                <div style={{
                  fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 38,
                  lineHeight: 1, color: t.color,
                }}>{t.n}</div>
                <div style={{
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
                  letterSpacing: 0.5, color: "var(--cs-muted)", textTransform: "uppercase", marginTop: 6,
                }}>{t.l}</div>
              </div>
            ))}
          </div>

          {/* My Reports link */}
          <Link href="/reports" style={{
            width: "100%", background: "var(--cs-card)",
            border: "2px solid var(--cs-line)", borderRadius: 14,
            padding: "16px 16px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 14,
            textDecoration: "none",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 11,
              background: "var(--cs-paper-deep)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ListIcon />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18,
                letterSpacing: 0.3, color: "var(--cs-ink)", textTransform: "uppercase",
              }}>My Reports</div>
              <div style={{
                fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 13.5,
                color: "var(--cs-muted)", marginTop: 2,
              }}>Track status of recent submissions</div>
            </div>
            <ChevronRightIcon />
          </Link>
        </div>
      </div>

      {/* ── FAB ──────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 60,
        padding: "14px 16px",
        background: "linear-gradient(to top, var(--cs-paper) 72%, transparent)",
        zIndex: 20,
      }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <Link href="/submit" style={{ display: "block", textDecoration: "none" }}>
            <BigButton>
              <PlusIcon />
              Report Incident
            </BigButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
