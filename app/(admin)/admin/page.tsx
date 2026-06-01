import StatusPill from "@/components/ui/StatusPill";
import TypeIconBadge, { IncidentTypeId } from "@/components/ui/TypeIconBadge";
import Avatar from "@/components/ui/Avatar";

// Seed data (will be replaced with Firestore in next phase)
const SEED = [
  { id: "s1", ref: "CS-1042", typeId: "injury",   reporter: "Devon Pryce",     location: "Bay 4 — Scaffold",    severity: "high", status: "new",    timeAgo: "2h ago"  },
  { id: "s2", ref: "CS-1041", typeId: "nearmiss",  reporter: "Tanya Whitfield", location: "Laydown Yard",        severity: "med",  status: "new",    timeAgo: "5h ago"  },
  { id: "s3", ref: "CS-1040", typeId: "hazard",    reporter: "Marcus Delgado",  location: "East Gate Walkway",   severity: "low",  status: "review", timeAgo: "9h ago"  },
  { id: "s4", ref: "CS-1039", typeId: "vehicle",   reporter: "Jamal Carter",    location: "Haul Road 2",         severity: "med",  status: "review", timeAgo: "1d ago"  },
  { id: "s5", ref: "CS-1038", typeId: "hazard",    reporter: "Rosa Iglesias",   location: "Substation B",        severity: "high", status: "review", timeAgo: "1d ago"  },
  { id: "s6", ref: "CS-1037", typeId: "nearmiss",  reporter: "Kyle Brennan",    location: "Fab Shop",            severity: "low",  status: "done",   timeAgo: "2d ago"  },
  { id: "s7", ref: "CS-1036", typeId: "injury",    reporter: "Ben Osei",        location: "Trench 3",            severity: "med",  status: "done",   timeAgo: "2d ago"  },
  { id: "s8", ref: "CS-1035", typeId: "hazard",    reporter: "Hector Ramos",    location: "Compound Stairs",     severity: "low",  status: "done",   timeAgo: "3d ago"  },
  { id: "s9", ref: "CS-1034", typeId: "vehicle",   reporter: "Naomi Foster",    location: "Crane Pad",           severity: "high", status: "done",   timeAgo: "4d ago"  },
] as const;

type SeedItem = typeof SEED[number];

const severityColor: Record<string, string> = {
  low:  "var(--cs-safe)",
  med:  "var(--cs-caution)",
  high: "var(--cs-critical)",
};
const severityLabel: Record<string, string> = { low: "Low", med: "Moderate", high: "High" };

const byType = [
  { id: "hazard",   label: "Hazard Recognition",  color: "var(--cs-caution)",  n: 3 },
  { id: "nearmiss", label: "Near Miss",            color: "var(--cs-orange)",   n: 2 },
  { id: "injury",   label: "Injury / Illness",     color: "var(--cs-critical)", n: 2 },
  { id: "vehicle",  label: "Veh. / Equip.",        color: "var(--cs-ink)",      n: 2 },
];

function KpiCard({ label, value, sub, accentColor, icon }: { label: string; value: number; sub: string; accentColor: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 16, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 5, background: accentColor }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 44, lineHeight: 1, color: "var(--cs-ink)" }}>{value}</div>
        {icon}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13.5, letterSpacing: 0.4, color: "var(--cs-ink2)", textTransform: "uppercase", marginTop: 10 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12.5, color: "var(--cs-muted)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: severityColor[severity], fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.2 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: severityColor[severity], transform: "rotate(45deg)", display: "inline-block" }} />
      {severityLabel[severity]}
    </span>
  );
}

function SmallIcon({ path, color = "var(--cs-muted)" }: { path: string; color?: string }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function SubmissionRow({ s }: { s: SeedItem }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "88px 1.6fr 1.2fr 1.2fr 1fr 0.9fr 1fr",
      gap: 14, padding: "14px 20px", alignItems: "center",
      borderBottom: "1.5px solid var(--cs-line)",
    }}
      className="hover:bg-cs-paper-deep cursor-pointer transition-colors"
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 600, color: "var(--cs-muted)", letterSpacing: 0.3 }}>{s.ref}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <TypeIconBadge typeId={s.typeId as IncidentTypeId} size={36} radius={9} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        <Avatar name={s.reporter} size={28} />
        <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.reporter}</span>
      </div>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--cs-ink2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.location}</span>
      <SeverityDot severity={s.severity} />
      <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-muted)" }}>{s.timeAgo}</span>
      <StatusPill status={s.status as "new" | "review" | "done"} size="sm" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const counts = { total: SEED.length, new: SEED.filter(s => s.status === "new").length, review: SEED.filter(s => s.status === "review").length, done: SEED.filter(s => s.status === "done").length, high: SEED.filter(s => s.severity === "high").length };
  const maxType = Math.max(...byType.map(b => b.n));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page header */}
      <div style={{ borderBottom: "2px solid var(--cs-line)", paddingBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, letterSpacing: 0.3, textTransform: "uppercase", lineHeight: 1 }}>Incident Submissions</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-muted)", marginTop: 4 }}>North Yard &amp; South Lot · Live feed</div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
        <KpiCard label="Reports this week" value={counts.total} sub="+3 vs last week" accentColor="var(--cs-ink)" icon={<SmallIcon path="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" color="var(--cs-ink)" />} />
        <KpiCard label="New — need triage" value={counts.new}   sub="Awaiting review" accentColor="var(--cs-info)" icon={<SmallIcon path="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6zM10 19a2 2 0 004 0" color="var(--cs-info)" />} />
        <KpiCard label="Under review"       value={counts.review} sub="In progress"   accentColor="var(--cs-caution)" icon={<SmallIcon path="M12 7.5V12l3 2M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17z" color="var(--cs-caution)" />} />
        <KpiCard label="High severity"      value={counts.high} sub="Across all open" accentColor="var(--cs-critical)" icon={<SmallIcon path="M12 3.5L22 20H2zM12 10v4.5" color="var(--cs-critical)" />} />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }} className="max-[860px]:grid-cols-1">
        {/* Reports by type */}
        <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 16, padding: 20 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 16 }}>Reports by type</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {byType.map(b => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 160, flexShrink: 0, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, color: "var(--cs-ink2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.label}</span>
                <div style={{ flex: 1, height: 22, background: "var(--cs-paper-deep)", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${(b.n / maxType) * 100}%`, height: "100%", background: b.color, borderRadius: 6 }} />
                </div>
                <span style={{ width: 24, textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--cs-ink)" }}>{b.n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status mix */}
        <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 16, padding: 20 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 16 }}>Status mix</div>
          <div style={{ display: "flex", height: 28, borderRadius: 8, overflow: "hidden", border: "1.5px solid var(--cs-line)", marginBottom: 16 }}>
            {[
              { n: counts.new,    color: "var(--cs-info)"    },
              { n: counts.review, color: "var(--cs-caution)" },
              { n: counts.done,   color: "var(--cs-safe)"    },
            ].map((s, i) => s.n > 0 && (
              <div key={i} style={{ width: `${(s.n / counts.total) * 100}%`, background: s.color }} />
            ))}
          </div>
          {[
            { label: "New",              n: counts.new,    color: "var(--cs-info)"    },
            { label: "Under Review",     n: counts.review, color: "var(--cs-caution)" },
            { label: "Review Completed", n: counts.done,   color: "var(--cs-safe)"    },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13.5, color: "var(--cs-ink2)" }}>{s.label}</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17 }}>{s.n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Submissions table */}
      <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: "2px solid var(--cs-line)", background: "var(--cs-paper-deep)", flexWrap: "wrap" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, textTransform: "uppercase", letterSpacing: 0.3 }}>All Submissions</div>
          <div style={{ marginLeft: "auto" }}>
            <input placeholder="Search ref, name, location…" style={{
              background: "var(--cs-paper)", border: "2px solid var(--cs-line)", borderRadius: 10,
              padding: "9px 14px", fontFamily: "var(--font-body)", fontSize: 14, outline: "none",
              color: "var(--cs-ink)", width: 260,
            }} />
          </div>
        </div>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "88px 1.6fr 1.2fr 1.2fr 1fr 0.9fr 1fr", gap: 14, padding: "13px 20px", background: "var(--cs-paper-deep)", borderBottom: "2px solid var(--cs-line)" }}
          className="hidden lg:grid">
          {["Ref", "Type", "Reporter", "Location", "Severity", "When", "Status"].map(h => (
            <span key={h} style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, letterSpacing: 0.6, color: "var(--cs-muted)", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>
        <div className="hidden lg:block">
          {SEED.map(s => <SubmissionRow key={s.id} s={s} />)}
        </div>
        {/* Mobile card list */}
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }} className="lg:hidden">
          {SEED.map(s => (
            <div key={s.id} style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <TypeIconBadge typeId={s.typeId as IncidentTypeId} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--cs-faint)", marginBottom: 2 }}>{s.ref}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: "var(--cs-ink)" }}>{s.reporter}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-muted)" }}>{s.location}</div>
                </div>
                <SeverityDot severity={s.severity} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1.5px solid var(--cs-line)", paddingTop: 10 }}>
                <StatusPill status={s.status as "new" | "review" | "done"} size="sm" />
                <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--cs-muted)" }}>{s.timeAgo}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
