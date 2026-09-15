"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/ui/AppHeader";
import Avatar from "@/components/ui/Avatar";
import TypeIconBadge, { IncidentTypeId, TYPE_META } from "@/components/ui/TypeIconBadge";
import StatusPill from "@/components/ui/StatusPill";
import { getActiveEmployees } from "@/lib/firebase/employees";
import { getIncidentsByEmployee } from "@/lib/firebase/incidents";
import { Employee, employeeFullName, Incident, IncidentStatus } from "@/lib/types";

// ─── Mappings ─────────────────────────────────────────────────────────────────

type CrewMember = { id: string; name: string; role: string; crew: string };

function toCrewMember(e: Employee): CrewMember {
  return {
    id: e.id,
    name: employeeFullName(e),
    role: e.role.charAt(0).toUpperCase() + e.role.slice(1),
    crew: e.crewName ?? "",
  };
}

const BADGE_ID: Record<string, IncidentTypeId> = {
  "hazard":           "hazard",
  "near-miss":        "nearmiss",
  "injury-illness":   "injury",
  "vehicle-accident": "vehicle",
};

const TYPE_LABEL: Record<string, string> = {
  "hazard":           "Hazard",
  "near-miss":        "Near Miss",
  "injury-illness":   "Injury / Illness",
  "vehicle-accident": "Vehicle Accident",
};

const STATUS_PILL_ID: Record<IncidentStatus, "new" | "review" | "done"> = {
  "new":               "new",
  "in-review":         "review",
  "review-completed":  "done",
};

const SEV_META = {
  low:  { label: "Low",      color: "var(--cs-safe)",     soft: "var(--cs-safe-soft)"     },
  med:  { label: "Moderate", color: "var(--cs-caution)",  soft: "var(--cs-caution-soft)"  },
  high: { label: "High",     color: "var(--cs-critical)", soft: "var(--cs-critical-soft)" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const SVG_PROPS = { fill: "none", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function SearchIcon() {
  return <svg width={20} height={20} viewBox="0 0 24 24" {...SVG_PROPS} stroke="var(--cs-faint)" style={{ display: "block" }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
}
function ChevronRightIcon() {
  return <svg width={20} height={20} viewBox="0 0 24 24" {...SVG_PROPS} stroke="var(--cs-faint)" style={{ flexShrink: 0 }}><path d="M9 5l7 7-7 7" /></svg>;
}
function CheckSmIcon() {
  return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 6" /></svg>;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ label }: { label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <div style={{ width: 30, height: 30, borderRadius: 999, border: "3px solid var(--cs-hiviz)", borderTopColor: "transparent", animation: "cs-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
      <div style={{ fontFamily: "var(--font-body)", color: "var(--cs-muted)", fontSize: 14 }}>{label}</div>
    </div>
  );
}

// ─── Step 1: Name Picker ──────────────────────────────────────────────────────

function NamePicker({ onSelect, onBack }: {
  onSelect: (m: CrewMember) => void;
  onBack: () => void;
}) {
  const [q, setQ] = useState("");
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveEmployees()
      .then((e) => setCrew(e.map(toCrewMember)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? crew.filter((c) => c.name.toLowerCase().includes(t) || c.role.toLowerCase().includes(t)) : crew;
  }, [q, crew]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <AppHeader title="My Reports" sub="Select your name" onBack={onBack} />

      <div style={{ padding: "16px 16px 10px", background: "var(--cs-paper)" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <SearchIcon />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type your name…"
            style={{
              width: "100%", boxSizing: "border-box",
              background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 12,
              padding: "14px 16px 14px 44px",
              fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 500, color: "var(--cs-ink)", outline: "none",
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px 30px", background: "var(--cs-paper)" }}>
        {loading ? (
          <Spinner label="Loading crew roster…" />
        ) : list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--cs-muted)", fontFamily: "var(--font-body)", fontSize: 15 }}>
            {crew.length === 0 ? "No employees in the roster yet." : `No match for "${q}".`}
          </div>
        ) : list.map((c) => (
          <button key={c.id} onClick={() => onSelect(c)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 14,
            padding: "12px 12px", marginBottom: 8, cursor: "pointer", textAlign: "left",
            background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 14,
          }}>
            <Avatar name={c.name} size={46} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: 0.2, color: "var(--cs-ink)" }}>{c.name}</div>
              <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 13, color: "var(--cs-muted)" }}>{c.role}{c.crew ? ` · ${c.crew}` : ""}</div>
            </div>
            <ChevronRightIcon />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Reports List ─────────────────────────────────────────────────────

function ReportsList({ member, onSelect, onBack }: {
  member: CrewMember;
  onSelect: (inc: Incident) => void;
  onBack: () => void;
}) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getIncidentsByEmployee(member.id)
      .then(setIncidents)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [member.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <AppHeader
        title="My Reports"
        onBack={onBack}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.10)", borderRadius: 999, padding: "5px 12px 5px 6px" }}>
            <Avatar name={member.name} size={26} />
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, color: "#fff" }}>{member.name.split(" ")[0]}</span>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px 40px", background: "var(--cs-paper)" }}>
        {loading && <Spinner label="Loading reports…" />}

        {error && (
          <div style={{ background: "var(--cs-critical-soft)", border: "1.5px solid var(--cs-critical)", borderRadius: 12, padding: "14px 16px", color: "var(--cs-critical)", fontFamily: "var(--font-body)", fontSize: 14 }}>
            Could not load reports. Please check your connection and try again.
          </div>
        )}

        {!loading && !error && incidents.length === 0 && (
          <div style={{ textAlign: "center", padding: "52px 24px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--cs-paper-deep)", border: "2px solid var(--cs-line)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="var(--cs-faint)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--cs-ink)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 8 }}>No reports yet</div>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14.5, color: "var(--cs-muted)", lineHeight: 1.55 }}>
              Your submitted reports will appear here.<br />Use the <strong style={{ color: "var(--cs-ink)" }}>+</strong> button on the home screen to report a hazard or incident.
            </div>
          </div>
        )}

        {!loading && !error && incidents.length > 0 && (
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13.5, letterSpacing: 1, color: "var(--cs-muted)", textTransform: "uppercase", marginBottom: 12 }}>
            {incidents.length} report{incidents.length !== 1 ? "s" : ""}
          </div>
        )}

        {incidents.map((inc) => {
          const badgeId = BADGE_ID[inc.type] ?? "hazard";
          const meta = TYPE_META[badgeId];
          const pillStatus = STATUS_PILL_ID[inc.status] ?? "new";
          return (
            <button key={inc.id} onClick={() => onSelect(inc)} style={{
              width: "100%", textAlign: "left", cursor: "pointer", marginBottom: 10,
              background: "var(--cs-card)", borderRadius: 14, border: "2px solid var(--cs-line)",
              overflow: "hidden", display: "block",
            }}>
              <div style={{ height: 4, background: meta.color }} />
              <div style={{ padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <TypeIconBadge typeId={badgeId} size={44} radius={11} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, letterSpacing: 0.2, color: "var(--cs-ink)", textTransform: "uppercase" }}>
                      {TYPE_LABEL[inc.type] ?? inc.type}
                    </span>
                    <StatusPill status={pillStatus} size="sm" />
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12.5, color: "var(--cs-muted)", marginBottom: 5 }}>
                    {fmtDate(inc.date)}{inc.location ? ` · ${inc.location}` : ""}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-body)", fontWeight: 400, fontSize: 13.5, color: "var(--cs-ink2)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {inc.description}
                  </div>
                </div>
                <ChevronRightIcon />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Detail View ──────────────────────────────────────────────────────

const STATUS_STEPS: { key: IncidentStatus; label: string }[] = [
  { key: "new",              label: "Submitted"    },
  { key: "in-review",       label: "Under Review" },
  { key: "review-completed", label: "Closed"       },
];

function statusIndex(s: IncidentStatus) {
  return STATUS_STEPS.findIndex((x) => x.key === s);
}

function DetailView({ incident, onBack }: { incident: Incident; onBack: () => void }) {
  const badgeId = BADGE_ID[incident.type] ?? "hazard";
  const meta = TYPE_META[badgeId];
  const doneIdx = statusIndex(incident.status);
  const refNo = "CS-" + incident.id.slice(0, 6).toUpperCase();
  const sev = incident.severity as keyof typeof SEV_META | undefined;
  const sevMeta = sev ? SEV_META[sev] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <AppHeader
        title={TYPE_LABEL[incident.type] ?? "Incident"}
        sub={refNo}
        onBack={onBack}
        accentColor={meta.color}
        right={<TypeIconBadge typeId={badgeId} size={38} radius={10} />}
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 40px", background: "var(--cs-paper)", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Status timeline */}
        <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 16, padding: "16px 18px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11.5, letterSpacing: 1.2, color: "var(--cs-muted)", textTransform: "uppercase", marginBottom: 16 }}>Report Status</div>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {STATUS_STEPS.map((step, i) => {
              const done = i <= doneIdx;
              const current = i === doneIdx;
              const isLast = i === STATUS_STEPS.length - 1;
              return (
                <div key={step.key} style={{ display: "flex", alignItems: "flex-start", flex: isLast ? 0 : 1 }}>
                  {/* Node + label */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 999, flexShrink: 0,
                      background: done ? "var(--cs-safe)" : "var(--cs-paper-deep)",
                      border: `2.5px solid ${done ? "var(--cs-safe)" : "var(--cs-line)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: current ? "0 0 0 5px var(--cs-safe-soft)" : "none",
                    }}>
                      {done
                        ? <CheckSmIcon />
                        : <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--cs-line-strong)" }} />
                      }
                    </div>
                    <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 11, color: done ? "var(--cs-safe)" : "var(--cs-faint)", textAlign: "center", lineHeight: 1.25 }}>
                      {step.label}
                    </div>
                  </div>
                  {/* Connector */}
                  {!isLast && (
                    <div style={{ flex: 1, height: 2.5, background: i < doneIdx ? "var(--cs-safe)" : "var(--cs-line)", margin: "14px 4px 0" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Core details */}
        <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11.5, letterSpacing: 1.2, color: "var(--cs-muted)", textTransform: "uppercase" }}>Report Details</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <InfoField label="Date" value={fmtDate(incident.date)} />
            {incident.location && <InfoField label="Location" value={incident.location} />}
            {sevMeta && (
              <div>
                <FieldLabel>Severity</FieldLabel>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: sevMeta.soft, color: sevMeta.color,
                  border: `1.5px solid ${sevMeta.color}`, borderRadius: 999,
                  padding: "3px 10px", fontFamily: "var(--font-body)", fontWeight: 700,
                  fontSize: 12, letterSpacing: 0.2, textTransform: "uppercase",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: sevMeta.color }} />
                  {sevMeta.label}
                </span>
              </div>
            )}
            <InfoField label="Submitted by" value={incident.submittedBy} />
          </div>

          <div>
            <FieldLabel>What happened</FieldLabel>
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 400, fontSize: 14.5, color: "var(--cs-ink)", lineHeight: 1.6 }}>{incident.description}</div>
          </div>
        </div>

        {/* Type-specific details */}
        {incident.hazardDetails && (incident.hazardDetails.hazardType || incident.hazardDetails.immediateAction) && (
          <DetailsCard title="Hazard Details">
            {incident.hazardDetails.hazardType    && <InfoField label="Hazard category"    value={incident.hazardDetails.hazardType} />}
            {incident.hazardDetails.immediateAction && <InfoField label="Corrective action" value={incident.hazardDetails.immediateAction} />}
          </DetailsCard>
        )}

        {incident.nearMissDetails?.whatHappened && (
          <DetailsCard title="Near Miss Details">
            <InfoField label="Contributing factor" value={incident.nearMissDetails.whatHappened} />
          </DetailsCard>
        )}

        {incident.injuryDetails && (
          <DetailsCard title="Injury Details">
            {incident.injuryDetails.bodyPart && <InfoField label="Body part(s)" value={incident.injuryDetails.bodyPart} />}
            <InfoField label="Medical treatment" value={incident.injuryDetails.medicalTreatment.replace("-", " ")} />
          </DetailsCard>
        )}

        {incident.vehicleDetails && (
          <DetailsCard title="Vehicle / Equipment">
            {incident.vehicleDetails.vehicleId && <InfoField label="Vehicle / Equipment ID"  value={incident.vehicleDetails.vehicleId} />}
            {incident.vehicleDetails.damageDescription && <InfoField label="Damage"           value={incident.vehicleDetails.damageDescription} />}
            <InfoField label="Third party involved" value={incident.vehicleDetails.otherPartyInvolved ? "Yes" : "No"} />
          </DetailsCard>
        )}

        {incident.investigationNotes && (
          <DetailsCard title="Investigation Notes">
            <div style={{ fontFamily: "var(--font-body)", fontWeight: 400, fontSize: 14.5, color: "var(--cs-ink)", lineHeight: 1.6 }}>{incident.investigationNotes}</div>
            {incident.reviewedBy && <InfoField label="Reviewed by" value={incident.reviewedBy} />}
          </DetailsCard>
        )}
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: 0.5, color: "var(--cs-muted)", textTransform: "uppercase", marginBottom: 5 }}>
      {children}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14, color: "var(--cs-ink)", textTransform: "capitalize" }}>{value}</div>
    </div>
  );
}

function DetailsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11.5, letterSpacing: 1.2, color: "var(--cs-muted)", textTransform: "uppercase" }}>{title}</div>
      {children}
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

type Step = "picker" | "list" | "detail";

export default function MyReportsPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("picker");
  const [member, setMember] = useState<CrewMember | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);

  if (step === "picker") return (
    <NamePicker
      onSelect={(m) => { setMember(m); setStep("list"); }}
      onBack={() => router.back()}
    />
  );

  if (step === "list" && member) return (
    <ReportsList
      member={member}
      onSelect={(inc) => { setIncident(inc); setStep("detail"); }}
      onBack={() => setStep("picker")}
    />
  );

  if (step === "detail" && incident) return (
    <DetailView
      incident={incident}
      onBack={() => setStep("list")}
    />
  );

  return null;
}
