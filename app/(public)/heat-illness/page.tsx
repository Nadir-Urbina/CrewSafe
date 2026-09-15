"use client";

import { useState, useEffect, useMemo } from "react";
import AppHeader from "@/components/ui/AppHeader";
import Avatar from "@/components/ui/Avatar";
import HazardStripe from "@/components/ui/HazardStripe";
import { getActiveEmployees } from "@/lib/firebase/employees";
import { addHeatLog } from "@/lib/firebase/heatLogs";
import { getHeatProgram, matchLevel, DEFAULT_HEAT_PROGRAM } from "@/lib/firebase/heatProgram";
import { Employee, HeatProgram, employeeFullName } from "@/lib/types";

// ─── Icons ────────────────────────────────────────────────────────────────────
const sp = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function SearchIcon()   { return <svg width={18} height={18} viewBox="0 0 24 24" {...sp}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>; }
function ChevronRight() { return <svg width={20} height={20} viewBox="0 0 24 24" {...sp}><path d="M9 18l6-6-6-6"/></svg>; }
function LocationIcon() { return <svg width={16} height={16} viewBox="0 0 24 24" {...sp}><path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z"/><circle cx="12" cy="9" r="2.5"/></svg>; }
function ThermometerIcon() { return <svg width={28} height={28} viewBox="0 0 24 24" {...sp}><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>; }
function CheckIcon()    { return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 6"/></svg>; }
function AlertIcon()    { return <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }

// ─── Level accent colors (tied to position, not content) ─────────────────────
const LEVEL_ACCENTS = [
  { color: "var(--cs-caution)", bgColor: "#FFFBEB", borderColor: "var(--cs-caution)" },
  { color: "#D97706",           bgColor: "#FEF3C7", borderColor: "#D97706"           },
  { color: "var(--cs-critical)", bgColor: "var(--cs-critical-soft)", borderColor: "var(--cs-critical)" },
];

const SAFE_ACCENT = { color: "var(--cs-safe)", bgColor: "var(--cs-safe-soft)", borderColor: "var(--cs-safe)" };
const SAFE_ACTIONS = [
  "Drinking water available for all workers",
  "Shaded rest areas accessible on-site",
];

// ─── Step 1: Name picker ──────────────────────────────────────────────────────
type CrewMember = { id: string; name: string; role: string; crew: string };

function NamePicker({ onSelect }: { onSelect: (m: CrewMember) => void }) {
  const [q, setQ]           = useState("");
  const [crew, setCrew]     = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveEmployees()
      .then((emps: Employee[]) => setCrew(emps.map((e) => ({
        id:   e.id,
        name: employeeFullName(e),
        role: e.role.charAt(0).toUpperCase() + e.role.slice(1),
        crew: e.crewName ?? "",
      }))))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? crew.filter((c) => c.name.toLowerCase().includes(t)) : crew;
  }, [q, crew]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <AppHeader title="Who's Checking?" sub="Select your name" />

      <div style={{ padding: "16px 16px 8px", background: "var(--cs-paper)" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--cs-muted)" }}>
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

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 14px 30px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, border: "3px solid var(--cs-hiviz)", borderTopColor: "transparent", animation: "cs-spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontFamily: "var(--font-body)", color: "var(--cs-muted)", fontSize: 14 }}>Loading roster…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--cs-muted)", fontFamily: "var(--font-body)", fontSize: 15 }}>
            No match. Check the spelling or contact your admin.
          </div>
        ) : filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px", marginBottom: 8, cursor: "pointer", textAlign: "left", background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 14 }}
          >
            <Avatar name={c.name} size={46} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--cs-ink)" }}>{c.name}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-muted)" }}>{c.role}{c.crew ? ` · ${c.crew}` : ""}</div>
            </div>
            <ChevronRight />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Weather fetch ────────────────────────────────────────────────────────────
interface WeatherResult {
  tempF:        number;
  heatIndexF:   number;
  lat:          number;
  lng:          number;
  locationName: string;
}

async function fetchWeather(): Promise<WeatherResult> {
  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
  );

  const { latitude: lat, longitude: lng } = pos.coords;

  const [weatherRes, geoRes] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature&temperature_unit=fahrenheit&forecast_days=1`),
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { "User-Agent": "HardHatLeague/1.0 (safety app)" },
    }),
  ]);

  const weather    = await weatherRes.json();
  const tempF      = Math.round(weather.current.temperature_2m as number);
  const heatIndexF = Math.round(weather.current.apparent_temperature as number);

  let locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  if (geoRes.ok) {
    const geo = await geoRes.json();
    const a   = geo.address ?? {};
    const parts = [a.road, a.city ?? a.town ?? a.village, a.state].filter(Boolean);
    if (parts.length) locationName = parts.join(", ");
  }

  return { tempF, heatIndexF, lat, lng, locationName };
}

// ─── Step 2: Checklist screen ─────────────────────────────────────────────────
function ChecklistScreen({
  member,
  onBack,
  onDone,
}: {
  member: CrewMember;
  onBack: () => void;
  onDone: (logId: string) => void;
}) {
  const [fetchState, setFetchState] = useState<"locating" | "ready" | "denied" | "error">("locating");
  const [weather,    setWeather]    = useState<WeatherResult | null>(null);
  const [program,    setProgram]    = useState<HeatProgram>(DEFAULT_HEAT_PROGRAM);
  const [checked,    setChecked]    = useState<Record<number, boolean>>({});
  const [comments,   setComments]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState("");

  function runFetch() {
    setFetchState("locating");
    Promise.all([fetchWeather(), getHeatProgram()])
      .then(([w, prog]) => { setWeather(w); setProgram(prog); setFetchState("ready"); })
      .catch((err) => {
        if (err instanceof GeolocationPositionError && err.code === err.PERMISSION_DENIED) {
          setFetchState("denied");
        } else {
          setFetchState("error");
        }
      });
  }

  useEffect(() => { runFetch(); }, []);

  const matched    = weather ? matchLevel(weather.heatIndexF, program) : null;
  const accent     = matched ? LEVEL_ACCENTS[matched.index] : SAFE_ACCENT;
  const levelName  = matched ? matched.level.name : "Low Risk";
  const sublabel   = matched
    ? (matched.index === 2
        ? `${matched.level.minTemp}°F and above — follow all required actions`
        : `${matched.level.minTemp}–${matched.level.maxTemp}°F — follow all required actions`)
    : `Below ${program.levels[0].minTemp}°F — basic precautions recommended`;
  const items      = matched ? matched.level.actions : SAFE_ACTIONS;
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allChecked = items.length > 0 && checkedCount === items.length;

  function toggle(i: number) {
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  async function handleSubmit() {
    if (!weather) return;
    setSubmitting(true);
    setSubmitErr("");
    try {
      const checklistMap: Record<string, boolean> = {};
      items.forEach((item, i) => { checklistMap[item] = !!checked[i]; });

      const logId = await addHeatLog({
        supervisorId:   member.id,
        supervisorName: member.name,
        temperature:    weather.heatIndexF,
        threshold:      levelName,
        location:       { lat: weather.lat, lng: weather.lng },
        locationName:   weather.locationName,
        checklist:      checklistMap,
        comments:       comments.trim(),
      });
      onDone(logId);
    } catch {
      setSubmitErr("Submission failed. Please try again.");
      setSubmitting(false);
    }
  }

  // Locating spinner
  if (fetchState === "locating") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <AppHeader title="Heat Check" sub={member.name} onBack={onBack} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, border: "4px solid var(--cs-hiviz)", borderTopColor: "transparent", animation: "cs-spin 0.8s linear infinite" }} />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--cs-ink)", textTransform: "uppercase", letterSpacing: 0.3 }}>Getting your location…</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--cs-muted)", textAlign: "center", maxWidth: 280 }}>
            Allow location access when prompted, then we&apos;ll check the current temperature.
          </div>
        </div>
      </div>
    );
  }

  // Error / denied
  if (fetchState === "denied" || fetchState === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <AppHeader title="Heat Check" sub={member.name} onBack={onBack} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: "var(--cs-critical-soft)", border: "2px solid var(--cs-critical)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--cs-critical)" }}>
            <AlertIcon />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--cs-ink)", textTransform: "uppercase", textAlign: "center" }}>
            {fetchState === "denied" ? "Location Denied" : "Weather Unavailable"}
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--cs-muted)", textAlign: "center", lineHeight: 1.6, maxWidth: 300 }}>
            {fetchState === "denied"
              ? "Enable location access in your browser settings, then try again."
              : "Could not reach the weather service. Check your connection and try again."}
          </div>
          <button
            onClick={runFetch}
            style={{ marginTop: 8, padding: "14px 28px", borderRadius: 12, background: "var(--cs-hiviz)", color: "var(--cs-ink)", border: "2px solid var(--cs-ink)", boxShadow: "0 4px 0 var(--cs-ink)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, letterSpacing: 0.4, textTransform: "uppercase", cursor: "pointer" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Ready: show checklist
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <AppHeader title="Heat Check" sub={member.name} onBack={onBack} />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 32px" }}>

        {/* Temperature hero */}
        <div style={{ background: accent.bgColor, border: `2px solid ${accent.borderColor}`, borderRadius: 20, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "24px 20px 20px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ color: accent.color }}><ThermometerIcon /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: accent.color, opacity: 0.8 }}>
                Feels Like
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 52, color: accent.color, lineHeight: 1 }}>
                {weather!.heatIndexF}°F
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--cs-ink2)", marginTop: 2 }}>
                Actual: {weather!.tempF}°F
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: accent.color, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 6 }}>
                {levelName}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-ink2)", marginTop: 2 }}>
                {sublabel}
              </div>
            </div>
          </div>
          <div style={{ padding: "10px 20px 14px", borderTop: `1px solid ${accent.borderColor}`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: accent.color }}><LocationIcon /></span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-ink2)" }}>{weather!.locationName}</span>
          </div>
        </div>

        {/* Checklist */}
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--cs-muted)", marginBottom: 10, paddingLeft: 2 }}>
          OSHA Prevention Checklist
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {items.map((item, i) => {
            const done = !!checked[i];
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px",
                  background: done ? "var(--cs-safe-soft)" : "var(--cs-card)",
                  border: `2px solid ${done ? "var(--cs-safe)" : "var(--cs-line)"}`,
                  borderRadius: 14, cursor: "pointer", textAlign: "left", width: "100%",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: done ? accent.color : "var(--cs-paper-deep)",
                  border: `2px solid ${done ? accent.color : "var(--cs-line)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: done ? "#fff" : "transparent",
                }}>
                  <CheckIcon />
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500, color: "var(--cs-ink)", lineHeight: 1.45, flex: 1 }}>
                  {item}
                </div>
              </button>
            );
          })}
        </div>

        {/* Comments */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--cs-muted)", marginBottom: 10, paddingLeft: 2 }}>
            Additional Notes (Optional)
          </div>
          <textarea
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Site-specific observations, concerns, or actions taken…"
            style={{ width: "100%", boxSizing: "border-box", background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 12, padding: "12px 14px", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500, color: "var(--cs-ink)", outline: "none", resize: "vertical", lineHeight: 1.55 }}
          />
        </div>

        {submitErr && (
          <div style={{ marginBottom: 16, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--cs-critical)", background: "var(--cs-critical-soft)", border: "1.5px solid var(--cs-critical)", borderRadius: 10, padding: "10px 14px" }}>
            {submitErr}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!allChecked || submitting}
          style={{
            width: "100%", height: 60, borderRadius: 14,
            background: allChecked && !submitting ? "var(--cs-hiviz)" : "var(--cs-paper-deep)",
            color: allChecked && !submitting ? "var(--cs-ink)" : "var(--cs-faint)",
            border: `2.5px solid ${allChecked && !submitting ? "var(--cs-ink)" : "var(--cs-line)"}`,
            boxShadow: allChecked && !submitting ? "0 5px 0 var(--cs-ink)" : "none",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, letterSpacing: 0.5, textTransform: "uppercase",
            cursor: allChecked && !submitting ? "pointer" : "not-allowed",
          }}
        >
          {submitting
            ? "Logging…"
            : allChecked
            ? "Log Compliance"
            : `Check All Items (${checkedCount}/${items.length})`}
        </button>

        {!allChecked && (
          <div style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-muted)", marginTop: 10 }}>
            Tap each item to confirm it&apos;s in place before logging.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Success ──────────────────────────────────────────────────────────
function SuccessScreen({ logId, member, onReset }: { logId: string; member: CrewMember; onReset: () => void }) {
  const ref = "HL-" + logId.slice(0, 6).toUpperCase();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", padding: 28 }}>
      <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 24, overflow: "hidden", width: "100%", maxWidth: 380, boxShadow: "0 8px 0 var(--cs-ink)" }}>
        <HazardStripe height={6} />
        <div style={{ padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: 999, background: "var(--cs-safe-soft)", border: "2px solid var(--cs-safe)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "cs-pop .4s cubic-bezier(.2,1.2,.3,1)", color: "var(--cs-safe)" }}>
            <CheckIcon />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: "var(--cs-ink)", textTransform: "uppercase", letterSpacing: 0.3 }}>
            Logged!
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--cs-muted)", marginTop: 8, lineHeight: 1.55 }}>
            Heat check recorded for <strong style={{ color: "var(--cs-ink)" }}>{member.name}</strong>.
          </div>
          <div style={{ margin: "20px 0", padding: "14px", background: "var(--cs-paper-deep)", border: "1.5px solid var(--cs-line)", borderRadius: 12 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--cs-muted)", marginBottom: 4 }}>Log Reference</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--cs-ink)", letterSpacing: 1 }}>{ref}</div>
          </div>
          <button
            onClick={onReset}
            style={{ width: "100%", height: 54, borderRadius: 12, background: "var(--cs-hiviz)", color: "var(--cs-ink)", border: "2px solid var(--cs-ink)", boxShadow: "0 4px 0 var(--cs-ink)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, letterSpacing: 0.5, textTransform: "uppercase", cursor: "pointer" }}
          >
            New Check
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type Step = { kind: "name" } | { kind: "check"; member: CrewMember } | { kind: "done"; logId: string; member: CrewMember };

export default function HeatIllnessPage() {
  const [step, setStep] = useState<Step>({ kind: "name" });

  if (step.kind === "done") {
    return <SuccessScreen logId={step.logId} member={step.member} onReset={() => setStep({ kind: "name" })} />;
  }
  if (step.kind === "check") {
    return (
      <ChecklistScreen
        member={step.member}
        onBack={() => setStep({ kind: "name" })}
        onDone={(logId) => setStep({ kind: "done", logId, member: step.member })}
      />
    );
  }
  return <NamePicker onSelect={(m) => setStep({ kind: "check", member: m })} />;
}
