"use client";

import { useState, useMemo, useEffect } from "react";
import AppHeader from "@/components/ui/AppHeader";
import BigButton from "@/components/ui/BigButton";
import TypeIconBadge, { IncidentTypeId } from "@/components/ui/TypeIconBadge";
import Avatar from "@/components/ui/Avatar";
import HazardStripe from "@/components/ui/HazardStripe";
import { useRouter } from "next/navigation";
import { getActiveEmployees } from "@/lib/firebase/employees";
import { Employee, employeeFullName } from "@/lib/types";

// ─── Firestore-backed crew (populated in NamePicker via useEffect) ────────────
type CrewMember = { id: string; name: string; role: string; crew: string };

function toCrewMember(e: Employee): CrewMember {
  return {
    id: e.id,
    name: employeeFullName(e),
    role: e.role.charAt(0).toUpperCase() + e.role.slice(1),
    crew: e.crewName ?? "",
  };
}

const INCIDENT_TYPES: { id: IncidentTypeId; label: string; short: string; accentColor: string }[] = [
  { id: "hazard",   label: "Hazard Recognition",          short: "Spotted an unsafe condition",    accentColor: "var(--cs-caution)"  },
  { id: "nearmiss", label: "Near Miss",                   short: "Almost happened — no harm",      accentColor: "var(--cs-orange)"   },
  { id: "injury",   label: "Injury / Illness",            short: "Someone was hurt or sick",       accentColor: "var(--cs-critical)" },
  { id: "vehicle",  label: "Vehicle / Equipment Accident",short: "Vehicle or equipment damage",    accentColor: "var(--cs-ink)"      },
];

// ─── Step 1: Name Picker ──────────────────────────────────────────────────────
function NamePicker({ onSelect, onBack }: { onSelect: (name: string, crew: string, employeeId: string) => void; onBack: () => void }) {
  const [q, setQ] = useState("");
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loadingCrew, setLoadingCrew] = useState(true);

  useEffect(() => {
    getActiveEmployees()
      .then((employees) => setCrew(employees.map(toCrewMember)))
      .catch(console.error)
      .finally(() => setLoadingCrew(false));
  }, []);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return crew.filter(c => !t || c.name.toLowerCase().includes(t) || c.role.toLowerCase().includes(t));
  }, [q, crew]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <AppHeader title="Who's Reporting?" sub="Step 1 of 3" onBack={onBack} />
      <div style={{ padding: "18px 18px 10px", background: "var(--cs-paper)" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <SearchIcon />
          </span>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Type your name…"
            style={{
              width: "100%", boxSizing: "border-box",
              background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 12,
              padding: "15px 16px 15px 44px",
              fontFamily: "var(--font-body)", fontSize: 16.5, fontWeight: 500, color: "var(--cs-ink)", outline: "none",
            }}
          />
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 13.5, color: "var(--cs-muted)", marginTop: 10, display: "flex", alignItems: "center", gap: 7 }}>
          <UserIcon /> No login needed — just tap your name.
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 14px 30px", background: "var(--cs-paper)" }}>
        {loadingCrew ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, border: "3px solid var(--cs-hiviz)", borderTopColor: "transparent", animation: "cs-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontFamily: "var(--font-body)", color: "var(--cs-muted)" }}>Loading crew roster…</div>
          </div>
        ) : list.length === 0 && crew.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--cs-muted)", fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.6 }}>
            No employees in the roster yet.<br />
            <span style={{ fontSize: 13 }}>Ask your admin to add employees first.</span>
          </div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--cs-muted)", fontFamily: "var(--font-body)", fontSize: 15 }}>
            No match for &ldquo;{q}&rdquo;. Check the spelling or ask your foreman.
          </div>
        ) : null}
        {list.map(c => (
          <button key={c.id} onClick={() => onSelect(c.name, c.crew, c.id)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 14,
            padding: "12px 12px", marginBottom: 8, cursor: "pointer", textAlign: "left",
            background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 14,
          }}>
            <Avatar name={c.name} size={46} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, letterSpacing: 0.2, color: "var(--cs-ink)" }}>{c.name}</div>
              <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 13, color: "var(--cs-muted)" }}>{c.role} · {c.crew}</div>
            </div>
            <ChevronRightIcon />
          </button>
        ))}
        {list.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--cs-muted)", fontFamily: "var(--font-body)", fontSize: 15 }}>
            No match for &ldquo;{q}&rdquo;. Check the spelling or ask your foreman.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Type Selector ────────────────────────────────────────────────────
function TypeSelector({ reporter, onSelect, onBack }: { reporter: string; onSelect: (id: IncidentTypeId) => void; onBack: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <AppHeader
        title="What Happened?"
        sub="Step 2 of 3"
        onBack={onBack}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.10)", borderRadius: 999, padding: "6px 12px 6px 6px" }}>
            <Avatar name={reporter} size={26} color="var(--cs-hiviz-deep)" />
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, color: "#fff" }}>{reporter.split(" ")[0]}</span>
          </div>
        }
      />
      <div style={{ flex: 1, overflowY: "auto", background: "var(--cs-paper)" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 18px 40px", display: "flex", flexDirection: "column", gap: 12 }}>
          {INCIDENT_TYPES.map(t => (
            <button key={t.id} onClick={() => onSelect(t.id)} style={{
              display: "flex", alignItems: "center", gap: 16, padding: 16,
              cursor: "pointer", textAlign: "left",
              background: "var(--cs-card)", border: "2px solid var(--cs-line)",
              borderRadius: 16, position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: t.accentColor }} />
              <TypeIconBadge typeId={t.id} size={56} radius={14} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 21, lineHeight: 1.05, letterSpacing: 0.2, color: "var(--cs-ink)", textTransform: "uppercase" }}>{t.label}</div>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14, color: "var(--cs-muted)", marginTop: 4 }}>{t.short}</div>
              </div>
              <ChevronRightIcon />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Incident Form ────────────────────────────────────────────────────
const HAZARD_CATS = ["Slip / Trip / Fall", "Working at height", "Electrical", "Housekeeping", "PPE", "Machinery / Guarding", "Manual handling", "Other"];
const NEARMISS_FACTORS = ["Equipment failure", "Procedure not followed", "Communication", "Housekeeping", "Fatigue", "Weather / ground", "Other"];
const BODY_PARTS = ["Head", "Eye", "Hand", "Arm", "Back", "Leg", "Foot", "Other"];
const DAMAGE_OPTS = ["Minor — cosmetic", "Moderate — operable", "Major — out of service"];

function IncidentForm({ typeId, reporter, onSubmit, onBack }: {
  typeId: IncidentTypeId; reporter: string;
  onSubmit: (data: Record<string, unknown>) => void;
  onBack: () => void;
}) {
  const [location, setLocation] = useState("");
  const [desc, setDesc] = useState("");
  const [severity, setSeverity] = useState("");
  // Hazard
  const [hazardCat, setHazardCat] = useState("");
  const [corrective, setCorrective] = useState("");
  // Near miss
  const [factor, setFactor] = useState("");
  // Injury
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [firstAid, setFirstAid] = useState<boolean | null>(null);
  // Vehicle
  const [assetId, setAssetId] = useState("");
  const [damage, setDamage] = useState("");
  const [thirdParty, setThirdParty] = useState<boolean | null>(null);

  const typeInfo = INCIDENT_TYPES.find(t => t.id === typeId)!;
  const whenLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }, []);

  const valid = location.trim() && desc.trim() && severity;

  const sevOpts = [
    { id: "low",  label: "Low",      color: "var(--cs-safe)"     },
    { id: "med",  label: "Moderate", color: "var(--cs-caution)"  },
    { id: "high", label: "High",     color: "var(--cs-critical)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <AppHeader
        title={typeInfo.label}
        sub="Step 3 of 3"
        onBack={onBack}
        accentColor={typeInfo.accentColor}
        right={<TypeIconBadge typeId={typeId} size={38} radius={10} />}
      />
      <div style={{ flex: 1, overflowY: "auto", background: "var(--cs-paper)", padding: "18px 18px 120px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Auto-filled context */}
        <div style={{ display: "flex", gap: 10 }}>
          {[{ label: "Reporter", val: reporter }, { label: "When · auto", val: whenLabel }].map(f => (
            <div key={f.label} style={{ flex: 1, background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 12, padding: "10px 13px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: 0.5, color: "var(--cs-faint)", textTransform: "uppercase" }}>{f.label}</div>
              <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14.5, color: "var(--cs-ink)", marginTop: 2 }}>{f.val}</div>
            </div>
          ))}
        </div>

        {/* Location */}
        <div>
          <FieldLabel required>Location on site</FieldLabel>
          <TextInput value={location} onChange={setLocation} placeholder="e.g. Bay 4 — Scaffold" />
        </div>

        {/* Severity */}
        <div>
          <FieldLabel required>How severe?</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {sevOpts.map(o => {
              const on = severity === o.id;
              return (
                <button key={o.id} onClick={() => setSeverity(o.id)} style={{
                  height: 54, borderRadius: 12, cursor: "pointer",
                  background: on ? o.color : "var(--cs-card)",
                  border: `2px solid ${on ? o.color : "var(--cs-line)"}`,
                  color: on ? "#fff" : "var(--cs-ink2)",
                  fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16,
                  letterSpacing: 0.4, textTransform: "uppercase",
                  boxShadow: on ? `0 3px 0 ${o.color}` : "none",
                }}>{o.label}</button>
              );
            })}
          </div>
        </div>

        {/* Hazard-specific */}
        {typeId === "hazard" && (<>
          <div>
            <FieldLabel>Hazard category</FieldLabel>
            <SelectField value={hazardCat} onChange={setHazardCat} options={HAZARD_CATS} placeholder="Choose a category…" />
          </div>
          <div>
            <FieldLabel>Corrective action taken</FieldLabel>
            <TextInput value={corrective} onChange={setCorrective} placeholder="e.g. Cordoned off, tagged out" />
          </div>
        </>)}

        {/* Near-miss-specific */}
        {typeId === "nearmiss" && (
          <div>
            <FieldLabel>Main contributing factor</FieldLabel>
            <SelectField value={factor} onChange={setFactor} options={NEARMISS_FACTORS} placeholder="What led to it?" />
          </div>
        )}

        {/* Injury-specific */}
        {typeId === "injury" && (<>
          <div>
            <FieldLabel>Body part(s) affected</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
              {BODY_PARTS.map(p => {
                const on = bodyParts.includes(p);
                return (
                  <button key={p} onClick={() => setBodyParts(prev => on ? prev.filter(x => x !== p) : [...prev, p])} style={{
                    padding: "11px 16px", borderRadius: 10, cursor: "pointer",
                    background: on ? "var(--cs-ink)" : "var(--cs-card)",
                    border: `2px solid ${on ? "var(--cs-ink)" : "var(--cs-line)"}`,
                    color: on ? "#fff" : "var(--cs-ink2)",
                    fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14.5,
                  }}>{p}</button>
                );
              })}
            </div>
          </div>
          <div>
            <FieldLabel>First aid given on site?</FieldLabel>
            <YesNoToggle value={firstAid} onChange={setFirstAid} />
          </div>
        </>)}

        {/* Vehicle-specific */}
        {typeId === "vehicle" && (<>
          <div>
            <FieldLabel>Vehicle / equipment ID</FieldLabel>
            <TextInput value={assetId} onChange={setAssetId} placeholder="e.g. TH-204 Telehandler" />
          </div>
          <div>
            <FieldLabel>Damage extent</FieldLabel>
            <SelectField value={damage} onChange={setDamage} options={DAMAGE_OPTS} placeholder="How bad is it?" />
          </div>
          <div>
            <FieldLabel>Third party involved?</FieldLabel>
            <YesNoToggle value={thirdParty} onChange={setThirdParty} />
          </div>
        </>)}

        {/* Description */}
        <div>
          <FieldLabel required>What happened?</FieldLabel>
          <textarea
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Describe what you saw in plain words…"
            rows={4}
            style={{
              width: "100%", boxSizing: "border-box", resize: "none",
              background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 12,
              padding: "15px 16px", fontFamily: "var(--font-body)", fontSize: 16.5,
              fontWeight: 500, color: "var(--cs-ink)", outline: "none", lineHeight: 1.45,
            }}
          />
        </div>

        {/* Photos placeholder */}
        <div>
          <FieldLabel>Photos <span style={{ color: "var(--cs-faint)", fontWeight: 600 }}>· optional</span></FieldLabel>
          <button style={{
            width: 88, height: 88, borderRadius: 12, cursor: "pointer",
            border: "2.5px dashed var(--cs-line-strong)", background: "var(--cs-card)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
          }}>
            <CameraIcon />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, letterSpacing: 0.4, color: "var(--cs-ink2)", textTransform: "uppercase" }}>Add</span>
          </button>
        </div>
      </div>

      {/* Submit bar */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        padding: "14px 16px max(18px, env(safe-area-inset-bottom))",
        background: "linear-gradient(to top, var(--cs-paper) 72%, transparent)",
        zIndex: 20,
      }}>
        {!valid && (
          <div style={{ textAlign: "center", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, color: "var(--cs-muted)", marginBottom: 10 }}>
            Add a location, severity &amp; description to submit.
          </div>
        )}
        <BigButton onClick={() => valid && onSubmit({ typeId, reporter, location, severity, desc })} disabled={!valid}>
          Submit Report
        </BigButton>
      </div>
    </div>
  );
}

// ─── Step 4: Success Screen ───────────────────────────────────────────────────
function SuccessScreen({ refNo, onDone, onReports }: { refNo: string; onDone: () => void; onReports: () => void }) {
  const confetti = useMemo(() => {
    const cols = ["var(--cs-hiviz)", "var(--cs-critical)", "var(--cs-safe)", "var(--cs-caution)", "var(--cs-info)", "var(--cs-orange)"];
    return Array.from({ length: 28 }).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      dur: 2.2 + Math.random() * 1.6,
      col: cols[i % cols.length],
      size: 7 + Math.random() * 7,
      rot: Math.random() * 360,
    }));
  }, []);

  return (
    <div style={{ height: "100%", background: "var(--cs-ink)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Confetti */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
        {confetti.map((c, i) => (
          <div key={i} style={{
            position: "absolute", top: -20, left: `${c.left}%`,
            width: c.size, height: c.size * 1.4,
            background: c.col, borderRadius: 2, transform: `rotate(${c.rot}deg)`,
            animation: `cs-fall ${c.dur}s linear ${c.delay}s infinite`,
          }} />
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 2, padding: "76px 20px 30px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Check circle */}
        <div style={{
          width: 96, height: 96, borderRadius: 999, background: "var(--cs-safe)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 10px oklch(0.62 0.145 152 / 0.13)",
          animation: "cs-pop .5s cubic-bezier(.2,1.2,.3,1)",
        }}>
          <CheckIcon />
        </div>

        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 38, letterSpacing: 0.5, color: "#fff", textTransform: "uppercase", marginTop: 22, textAlign: "center", lineHeight: 0.98 }}>
          Report<br/>Submitted
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--cs-hiviz)", marginTop: 10, letterSpacing: 1 }}>
          REF {refNo}
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14.5, color: "rgba(255,255,255,0.65)", marginTop: 12, textAlign: "center", maxWidth: 280, lineHeight: 1.45 }}>
          Thanks for speaking up. Your safety team has been notified.
        </div>

        {/* Points burst */}
        <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 10, background: "var(--cs-hiviz)", borderRadius: 14, padding: "12px 20px", boxShadow: "0 8px 22px rgba(0,0,0,0.3)" }}>
          <ShieldIcon />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: "var(--cs-ink)", letterSpacing: 0.4 }}>+50 PTS</span>
        </div>

        {/* Gamification card */}
        <div style={{ width: "100%", marginTop: 22, background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.14)", borderRadius: 18, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FlameIcon />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#fff", letterSpacing: 0.3 }}>4-DAY STREAK</div>
              <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Reporting every shift — keep it lit.</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, letterSpacing: 0.5, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", whiteSpace: "nowrap" }}>Next rank: Safety Captain</span>
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, color: "var(--cs-hiviz)", whiteSpace: "nowrap" }}>185 / 250</span>
          </div>
          <div style={{ height: 16, background: "var(--cs-paper-deep)", borderRadius: 999, overflow: "hidden", border: "1.5px solid var(--cs-line)" }}>
            <div style={{ width: "74%", height: "100%", background: "var(--cs-hiviz)", borderRadius: 999 }} />
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12.5, color: "rgba(255,255,255,0.55)", marginTop: 8 }}>65 pts to go</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1.5px solid rgba(255,255,255,0.12)" }}>
            <TrophyIcon />
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: "#fff" }}>
              You&apos;re <b style={{ color: "var(--cs-hiviz)" }}>#3</b> on the North Yard leaderboard this month.
            </span>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ position: "relative", zIndex: 2, padding: "12px 18px 30px", display: "flex", flexDirection: "column", gap: 10, background: "var(--cs-ink)" }}>
        <BigButton onClick={onReports} variant="primary">View My Reports</BigButton>
        <button onClick={onDone} style={{
          width: "100%", height: 50, background: "transparent", border: "none", cursor: "pointer",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17,
          letterSpacing: 0.6, color: "rgba(255,255,255,0.7)", textTransform: "uppercase",
        }}>Back to Home</button>
      </div>
    </div>
  );
}

// ─── Wizard shell ─────────────────────────────────────────────────────────────
type Step = "name" | "type" | "form" | "success";

export default function SubmitPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [reporter, setReporter] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [typeId, setTypeId] = useState<IncidentTypeId | null>(null);
  const [refNo] = useState(() => `CS-${1043 + Math.floor(Math.random() * 50)}`);

  if (step === "name") return (
    <NamePicker
      onSelect={(name, _crew, id) => { setReporter(name); setEmployeeId(id); setStep("type"); }}
      onBack={() => router.back()}
    />
  );

  if (step === "type") return (
    <TypeSelector
      reporter={reporter}
      onSelect={(id) => { setTypeId(id); setStep("form"); }}
      onBack={() => setStep("name")}
    />
  );

  if (step === "form" && typeId) return (
    <IncidentForm
      typeId={typeId}
      reporter={reporter}
      onSubmit={() => setStep("success")}
      onBack={() => setStep("type")}
    />
  );

  if (step === "success") return (
    <SuccessScreen
      refNo={refNo}
      onDone={() => router.push("/")}
      onReports={() => router.push("/reports")}
    />
  );

  return null;
}

// ─── Small helper components ──────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--cs-ink2)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
      {children}
      {required && <span style={{ color: "var(--cs-critical)" }}>*</span>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", boxSizing: "border-box", background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 12, padding: "15px 16px", fontFamily: "var(--font-body)", fontSize: 16.5, fontWeight: 500, color: "var(--cs-ink)", outline: "none" }} />
  );
}

function SelectField({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 12, padding: "15px 16px", fontFamily: "var(--font-body)", fontSize: 16, fontWeight: 500, color: value ? "var(--cs-ink)" : "var(--cs-faint)", outline: "none", appearance: "none" }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function YesNoToggle({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {[{ v: false, l: "No" }, { v: true, l: "Yes" }].map(({ v, l }) => {
        const on = value === v;
        return (
          <button key={l} onClick={() => onChange(v)} style={{ flex: 1, height: 52, borderRadius: 12, cursor: "pointer", background: on ? "var(--cs-ink)" : "var(--cs-card)", border: `2px solid ${on ? "var(--cs-ink)" : "var(--cs-line)"}`, color: on ? "#fff" : "var(--cs-faint)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, letterSpacing: 0.4, textTransform: "uppercase" }}>{l}</button>
        );
      })}
    </div>
  );
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const p24 = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function SearchIcon() { return <svg width={20} height={20} viewBox="0 0 24 24" style={{ display: "block" }} {...p24} color="var(--cs-faint)"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>; }
function UserIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" style={{ display: "block" }} {...p24} color="var(--cs-faint)"><circle cx="12" cy="8" r="3.8"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/></svg>; }
function ChevronRightIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--cs-faint)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 5l7 7-7 7"/></svg>; }
function ShieldIcon() { return <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="var(--cs-ink)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>; }
function CameraIcon() { return <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="var(--cs-ink2)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5A1.5 1.5 0 014.5 7H7l1.5-2.2h7L17 7h2.5A1.5 1.5 0 0121 8.5v9A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 17.5z"/><circle cx="12" cy="13" r="3.4"/></svg>; }
function CheckIcon() { return <svg width={54} height={54} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 6"/></svg>; }
function FlameIcon() { return <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="var(--cs-caution)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c1 3-2 4-2 7a2 2 0 004 0c0-1 0-1.5.5-2.2C16 11 17 13 17 15a5 5 0 11-10 0c0-4 4-5 5-12z"/></svg>; }
function TrophyIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--cs-hiviz)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10v4a5 5 0 01-10 0zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M9 15h6M10 15v4M14 15v4M8 20h8"/></svg>; }
