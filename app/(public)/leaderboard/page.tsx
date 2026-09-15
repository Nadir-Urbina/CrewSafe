"use client";

import { useState, useEffect } from "react";
import AppHeader from "@/components/ui/AppHeader";
import Avatar from "@/components/ui/Avatar";
import HazardStripe from "@/components/ui/HazardStripe";
import { getActiveEmployees } from "@/lib/firebase/employees";
import { Employee, employeeFullName } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RankedEmployee extends Employee {
  rank: number;
  displayName: string;
}

// ─── Rank meta ────────────────────────────────────────────────────────────────

const RANK_META: Record<number, { color: string; soft: string; label: string }> = {
  1: { color: "var(--cs-hiviz)",   soft: "oklch(0.97 0.06 110)",  label: "1st" },
  2: { color: "oklch(0.72 0.01 80)", soft: "oklch(0.96 0.005 80)", label: "2nd" },
  3: { color: "var(--cs-orange)", soft: "var(--cs-orange-soft)",  label: "3rd" },
};

function rankFor(i: number): { color: string; soft: string; label: string } {
  return RANK_META[i] ?? { color: "var(--cs-muted)", soft: "var(--cs-paper-deep)", label: `${i}th` };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assignRanks(sorted: Employee[]): RankedEmployee[] {
  let rank = 1;
  return sorted.map((e, i) => {
    if (i > 0 && sorted[i].points < sorted[i - 1].points) rank = i + 1;
    return { ...e, rank, displayName: employeeFullName(e) };
  });
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function TrophyIcon({ color }: { color: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v4a5 5 0 01-10 0zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M9 15h6M10 15v4M14 15v4M8 20h8" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--cs-ink)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

// ─── Podium Card ──────────────────────────────────────────────────────────────

function PodiumCard({ entry, position }: { entry: RankedEmployee; position: 1 | 2 | 3 }) {
  const meta = RANK_META[position];
  const isFirst = position === 1;

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      paddingTop: isFirst ? 0 : position === 2 ? 20 : 32,
    }}>
      {/* Rank badge */}
      <div style={{
        width: isFirst ? 36 : 28, height: isFirst ? 36 : 28,
        borderRadius: 999, marginBottom: 8, flexShrink: 0,
        background: meta.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: isFirst ? `0 0 0 4px ${meta.soft}` : "none",
      }}>
        {isFirst
          ? <ShieldIcon />
          : <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, color: isFirst ? "var(--cs-ink)" : "#fff" }}>{position}</span>
        }
      </div>

      {/* Avatar */}
      <Avatar name={entry.displayName} size={isFirst ? 60 : 48} />

      {/* Name */}
      <div style={{
        fontFamily: "var(--font-display)", fontWeight: 800,
        fontSize: isFirst ? 16 : 13.5, letterSpacing: 0.2, color: "#fff",
        textTransform: "uppercase", marginTop: 8, textAlign: "center",
        maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        padding: "0 4px",
      }}>
        {entry.displayName.split(" ")[0]}
      </div>

      {/* Crew */}
      {entry.crewName && (
        <div style={{
          fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 11,
          color: "rgba(255,255,255,0.5)", marginTop: 1, textAlign: "center",
          maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          padding: "0 4px",
        }}>
          {entry.crewName}
        </div>
      )}

      {/* Points */}
      <div style={{
        marginTop: 8,
        background: isFirst ? meta.color : "rgba(255,255,255,0.12)",
        border: `1.5px solid ${isFirst ? meta.color : "rgba(255,255,255,0.2)"}`,
        borderRadius: 999, padding: "4px 12px",
        fontFamily: "var(--font-display)", fontWeight: 800,
        fontSize: isFirst ? 17 : 14, color: isFirst ? "var(--cs-ink)" : "#fff",
        letterSpacing: 0.3,
      }}>
        {entry.points.toLocaleString()} <span style={{ fontWeight: 700, opacity: 0.7, fontSize: "0.75em" }}>PTS</span>
      </div>

      {/* Podium base */}
      <div style={{
        marginTop: 10, width: "100%",
        height: isFirst ? 52 : position === 2 ? 36 : 24,
        background: isFirst ? meta.color : "rgba(255,255,255,0.10)",
        borderRadius: "8px 8px 0 0",
        border: `1.5px solid ${isFirst ? meta.soft : "rgba(255,255,255,0.15)"}`,
        borderBottom: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: isFirst ? 22 : 17, color: isFirst ? "var(--cs-ink)" : "rgba(255,255,255,0.5)",
          letterSpacing: 0.5,
        }}>{meta.label}</span>
      </div>
    </div>
  );
}

// ─── Ranked Row ───────────────────────────────────────────────────────────────

function RankedRow({ entry }: { entry: RankedEmployee }) {
  const isTop10 = entry.rank <= 10;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 14px", marginBottom: 8,
      background: "var(--cs-card)", border: "2px solid var(--cs-line)",
      borderRadius: 14, overflow: "hidden",
    }}>
      {/* Rank number */}
      <div style={{
        width: 32, flexShrink: 0, textAlign: "center",
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18,
        color: isTop10 ? "var(--cs-ink)" : "var(--cs-faint)", letterSpacing: 0.3,
      }}>
        {entry.rank}
      </div>

      {/* Avatar */}
      <Avatar name={entry.displayName} size={42} />

      {/* Name + crew */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17,
          letterSpacing: 0.2, color: "var(--cs-ink)", textTransform: "uppercase",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {entry.displayName}
        </div>
        {(entry.crewName || entry.role) && (
          <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12.5, color: "var(--cs-muted)", marginTop: 1 }}>
            {[entry.crewName, entry.role.charAt(0).toUpperCase() + entry.role.slice(1)].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>

      {/* Points */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0,
      }}>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20,
          color: "var(--cs-ink)", lineHeight: 1,
        }}>
          {entry.points.toLocaleString()}
        </div>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 10,
          letterSpacing: 0.8, color: "var(--cs-muted)", textTransform: "uppercase",
        }}>pts</div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [ranked, setRanked] = useState<RankedEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveEmployees()
      .then((employees) => {
        const sorted = [...employees].sort((a, b) => b.points - a.points);
        setRanked(assignRanks(sorted));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const top3 = ranked.slice(0, 3);
  const rest  = ranked.slice(3);
  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as RankedEmployee[];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, background: "var(--cs-ink)", zIndex: 30 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 18px 0",
          paddingTop: "max(18px, env(safe-area-inset-top))",
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "#fff", letterSpacing: 0.4, textTransform: "uppercase", lineHeight: 1 }}>
            Leader<span style={{ color: "var(--cs-hiviz)" }}>board</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.10)", border: "1.5px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "5px 12px" }}>
            <TrophyIcon color="var(--cs-hiviz)" />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12.5, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 0.5 }}>All Time</span>
          </div>
        </div>

        {/* ── Podium ──────────────────────────────────────────────── */}
        {!loading && top3.length > 0 && (
          <div style={{ padding: "20px 14px 0", display: "flex", gap: 8, alignItems: "flex-end" }}>
            {podiumOrder.map((entry) => (
              <PodiumCard key={entry.id} entry={entry} position={entry.rank as 1 | 2 | 3} />
            ))}
          </div>
        )}

        {loading && (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: 999, border: "3px solid var(--cs-hiviz)", borderTopColor: "transparent", animation: "cs-spin 0.8s linear infinite", margin: "0 auto 10px" }} />
            <div style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Loading rankings…</div>
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <HazardStripe height={8} />
        </div>
      </div>

      {/* ── Ranked list ────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px 40px", background: "var(--cs-paper)" }}>

        {/* No data yet */}
        {!loading && ranked.length === 0 && (
          <div style={{ textAlign: "center", padding: "52px 24px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--cs-paper-deep)", border: "2px solid var(--cs-line)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <TrophyIcon color="var(--cs-faint)" />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--cs-ink)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 8 }}>No rankings yet</div>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14.5, color: "var(--cs-muted)", lineHeight: 1.55 }}>
              Start submitting safety reports to earn points and climb the leaderboard.
            </div>
          </div>
        )}

        {/* Section header for rest of list */}
        {rest.length > 0 && (
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13.5, letterSpacing: 1, color: "var(--cs-muted)", textTransform: "uppercase", marginBottom: 12 }}>
            Rankings
          </div>
        )}

        {rest.map((entry) => (
          <RankedRow key={entry.id} entry={entry} />
        ))}

        {/* If only 1–3 people, show all in the list as well (no "rest") */}
        {rest.length === 0 && ranked.length > 0 && !loading && (
          <div style={{ textAlign: "center", paddingTop: 12 }}>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 13.5, color: "var(--cs-muted)" }}>
              Submit more reports to grow the leaderboard.
            </div>
          </div>
        )}

        {/* Total participants count */}
        {ranked.length > 0 && (
          <div style={{ textAlign: "center", paddingTop: 16 }}>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12.5, color: "var(--cs-faint)" }}>
              {ranked.length} participant{ranked.length !== 1 ? "s" : ""} · Points earned from safety reports
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
