"use client";

import { useState, useEffect } from "react";
import {
  getHeatProgram, saveHeatLevel,
  DEFAULT_HEAT_PROGRAM,
} from "@/lib/firebase/heatProgram";
import { HeatProgram, HeatProgramLevel } from "@/lib/types";
import HazardStripe from "@/components/ui/HazardStripe";

// ─── Level accent (fixed per tier order) ─────────────────────────────────────
const LEVEL_ACCENTS = [
  { color: "#D97706", bgColor: "#FEF3C7", borderColor: "#D97706", label: "Level 1" },
  { color: "#EA580C", bgColor: "#FFF7ED", borderColor: "#EA580C", label: "Level 2" },
  { color: "var(--cs-critical)", bgColor: "var(--cs-critical-soft)", borderColor: "var(--cs-critical)", label: "Level 3" },
] as const;

// ─── Icons ────────────────────────────────────────────────────────────────────
const sp = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function EditIcon()    { return <svg width={16} height={16} viewBox="0 0 24 24" {...sp}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function XIcon()       { return <svg width={20} height={20} viewBox="0 0 24 24" {...sp}><path d="M6 6l12 12M18 6L6 18"/></svg>; }
function PlusIcon()    { return <svg width={16} height={16} viewBox="0 0 24 24" {...sp}><path d="M12 5v14M5 12h14"/></svg>; }
function TrashIcon()   { return <svg width={15} height={15} viewBox="0 0 24 24" {...sp}><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>; }
function ThermIcon()   { return <svg width={22} height={22} viewBox="0 0 24 24" {...sp}><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>; }

// ─── Drawer shell ─────────────────────────────────────────────────────────────
function Drawer({ title, onClose, children, footer }: {
  title: string; onClose: () => void;
  children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(20,18,14,0.45)", display: "flex", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(520px, 100vw)", height: "100%", background: "var(--cs-paper)", boxShadow: "-20px 0 50px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", animation: "cs-slide .22s ease" }}>
        <div style={{ background: "var(--cs-ink)", padding: "20px 20px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#fff", textTransform: "uppercase", letterSpacing: 0.4 }}>{title}</div>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,0.10)", border: "1.5px solid rgba(255,255,255,0.18)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", minHeight: 0 }}><XIcon /></button>
          </div>
          <div style={{ height: 3, background: "var(--cs-hiviz)", marginTop: 14 }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>{children}</div>
        {footer && <div style={{ padding: "16px 20px", borderTop: "2px solid var(--cs-line)", background: "var(--cs-card)", flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>
  );
}

const inputSx: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 10, padding: "12px 14px", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500, color: "var(--cs-ink)", outline: "none" };
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--cs-ink2)", marginBottom: 7 }}>{children}</div>;
}
function FieldRow({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 20 }}>{children}</div>;
}

// ─── Level Editor Drawer ──────────────────────────────────────────────────────
function LevelDrawer({
  index,
  initial,
  isLast,
  onClose,
  onSaved,
}: {
  index: 0 | 1 | 2;
  initial: HeatProgramLevel;
  isLast: boolean;
  onClose: () => void;
  onSaved: (updated: HeatProgramLevel) => void;
}) {
  const accent = LEVEL_ACCENTS[index];

  const [name,    setName]    = useState(initial.name);
  const [minTemp, setMinTemp] = useState(String(initial.minTemp));
  const [maxTemp, setMaxTemp] = useState(String(initial.maxTemp));
  const [actions, setActions] = useState<string[]>(initial.actions);
  const [newItem, setNewItem] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  function addAction() {
    const trimmed = newItem.trim();
    if (!trimmed || actions.includes(trimmed)) return;
    setActions((prev) => [...prev, trimmed]);
    setNewItem("");
  }

  function removeAction(i: number) {
    setActions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    const min = parseInt(minTemp, 10);
    const max = parseInt(maxTemp, 10);
    if (!name.trim())          { setError("Level name is required."); return; }
    if (isNaN(min) || min < 1) { setError("Enter a valid minimum temperature."); return; }
    if (!isLast && (isNaN(max) || max <= min)) { setError("Maximum must be greater than minimum."); return; }
    if (actions.length === 0)  { setError("Add at least one action item."); return; }

    setSaving(true);
    setError("");
    try {
      const updated: HeatProgramLevel = {
        name: name.trim(),
        minTemp: min,
        maxTemp: isLast ? 999 : max,
        actions,
      };
      await saveHeatLevel(index, updated);
      onSaved(updated);
    } catch {
      setError("Save failed. Please try again.");
      setSaving(false);
    }
  }

  return (
    <Drawer
      title={`Edit ${accent.label}`}
      onClose={onClose}
      footer={
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {error && (
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--cs-critical)", background: "var(--cs-critical-soft)", border: "1.5px solid var(--cs-critical)", borderRadius: 10, padding: "10px 14px" }}>
              {error}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ width: "100%", height: 52, borderRadius: 12, cursor: saving ? "not-allowed" : "pointer", background: saving ? "var(--cs-paper-deep)" : "var(--cs-hiviz)", color: saving ? "var(--cs-faint)" : "var(--cs-ink)", border: `2.5px solid ${saving ? "var(--cs-line)" : "var(--cs-ink)"}`, boxShadow: saving ? "none" : "0 4px 0 var(--cs-ink)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, letterSpacing: 0.5, textTransform: "uppercase" }}
          >
            {saving ? "Saving…" : "Save Level"}
          </button>
        </div>
      }
    >
      {/* Level badge */}
      <div style={{ background: accent.bgColor, border: `2px solid ${accent.borderColor}`, borderRadius: 12, padding: "10px 14px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ color: accent.color }}><ThermIcon /></div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: accent.color, textTransform: "uppercase", letterSpacing: 0.4 }}>{accent.label}</div>
      </div>

      <FieldRow>
        <FieldLabel>Level name</FieldLabel>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Moderate Risk" style={inputSx} />
      </FieldRow>

      <FieldRow>
        <FieldLabel>Temperature range (heat index °F)</FieldLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--cs-muted)", marginBottom: 5 }}>From (min)</div>
            <input
              type="number" min={1} value={minTemp}
              onChange={(e) => setMinTemp(e.target.value)}
              style={inputSx}
            />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--cs-muted)", paddingTop: 20 }}>–</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--cs-muted)", marginBottom: 5 }}>
              {isLast ? "No upper limit" : "To (max)"}
            </div>
            <input
              type="number" min={1} value={isLast ? "∞" : maxTemp}
              onChange={(e) => setMaxTemp(e.target.value)}
              disabled={isLast}
              style={{ ...inputSx, opacity: isLast ? 0.45 : 1, cursor: isLast ? "not-allowed" : "auto" }}
            />
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--cs-muted)", marginTop: 6 }}>
          {isLast
            ? `Triggers when heat index reaches ${minTemp}°F or higher.`
            : "Triggers when heat index falls within this range."}
        </div>
      </FieldRow>

      <FieldRow>
        <FieldLabel>Required actions ({actions.length})</FieldLabel>

        {/* Existing actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
          {actions.map((action, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: accent.bgColor, border: `1.5px solid ${accent.borderColor}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={accent.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 6"/></svg>
              </div>
              <span style={{ flex: 1, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--cs-ink)", lineHeight: 1.4 }}>{action}</span>
              <button
                onClick={() => removeAction(i)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cs-muted)", padding: 4, display: "flex", alignItems: "center", minHeight: 0, flexShrink: 0 }}
                title="Remove action"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>

        {/* Add new action */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAction(); } }}
            placeholder="Add a new required action…"
            style={{ ...inputSx, flex: 1 }}
          />
          <button
            onClick={addAction}
            disabled={!newItem.trim()}
            style={{ height: 48, width: 48, borderRadius: 10, background: newItem.trim() ? "var(--cs-hiviz)" : "var(--cs-paper-deep)", border: `2px solid ${newItem.trim() ? "var(--cs-ink)" : "var(--cs-line)"}`, cursor: newItem.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", color: newItem.trim() ? "var(--cs-ink)" : "var(--cs-faint)", flexShrink: 0, minHeight: 0 }}
          >
            <PlusIcon />
          </button>
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--cs-muted)", marginTop: 6 }}>
          Press Enter or tap + to add. These are shown to field workers as a compliance checklist.
        </div>
      </FieldRow>
    </Drawer>
  );
}

// ─── Level card ───────────────────────────────────────────────────────────────
function LevelCard({ level, index, isLast, onEdit }: {
  level: HeatProgramLevel;
  index: number;
  isLast: boolean;
  onEdit: () => void;
}) {
  const accent = LEVEL_ACCENTS[index];
  return (
    <div style={{ background: "var(--cs-card)", border: `2px solid ${accent.borderColor}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ height: 4, background: accent.color }} />
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: accent.color, background: accent.bgColor, border: `1.5px solid ${accent.borderColor}`, borderRadius: 6, padding: "2px 8px" }}>
                {accent.label}
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--cs-ink)" }}>
                {level.name}
              </span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: accent.color }}>
              {isLast
                ? `${level.minTemp}°F and above`
                : `${level.minTemp}°F – ${level.maxTemp}°F`}
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 12, color: "var(--cs-muted)", marginLeft: 6 }}>heat index</span>
            </div>
          </div>
          <button
            onClick={onEdit}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 9, background: "var(--cs-paper-deep)", border: "1.5px solid var(--cs-line)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, letterSpacing: 0.3, textTransform: "uppercase", color: "var(--cs-ink2)", minHeight: 0, flexShrink: 0 }}
          >
            <EditIcon /> Edit
          </button>
        </div>

        {/* Actions preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {level.actions.slice(0, 4).map((action, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: accent.bgColor, border: `1.5px solid ${accent.borderColor}`, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={accent.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 6"/></svg>
              </div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-ink2)", lineHeight: 1.4 }}>{action}</span>
            </div>
          ))}
          {level.actions.length > 4 && (
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--cs-muted)", marginTop: 2, paddingLeft: 24 }}>
              +{level.actions.length - 4} more actions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminHeatIllnessPage() {
  const [program,  setProgram]  = useState<HeatProgram>(DEFAULT_HEAT_PROGRAM);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState<0 | 1 | 2 | null>(null);

  useEffect(() => {
    getHeatProgram()
      .then(setProgram)
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(index: 0 | 1 | 2, updated: HeatProgramLevel) {
    setProgram((prev) => {
      const levels = [...prev.levels] as HeatProgram["levels"];
      levels[index] = updated;
      return { levels };
    });
    setEditing(null);
  }

  return (
    <div style={{ padding: "28px 24px", maxWidth: 760, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ color: "var(--cs-critical)" }}><ThermIcon /></div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "var(--cs-ink)", textTransform: "uppercase", letterSpacing: 0.4, margin: 0 }}>
            Heat Illness Program
          </h1>
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--cs-muted)", margin: 0 }}>
          Configure the three heat alert levels your crew sees in the field. Each level defines a heat index range and the OSHA-aligned actions workers must acknowledge.
        </p>
      </div>

      {/* Info banner */}
      <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 14, overflow: "hidden", marginBottom: 28 }}>
        <HazardStripe height={4} />
        <div style={{ padding: "14px 18px", display: "flex", gap: 12 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--cs-hiviz-deep)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--cs-ink2)", margin: 0, lineHeight: 1.6 }}>
            Thresholds use the <strong style={{ color: "var(--cs-ink)" }}>heat index (feels like)</strong>, not air temperature. Below Level 1&apos;s minimum, the app shows <em>Low Risk</em> with basic precautions. Level 3 has no upper bound — it applies to any reading at or above its minimum.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--cs-muted)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, letterSpacing: 0.5, textTransform: "uppercase" }}>
          Loading…
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {program.levels.map((level, i) => (
            <LevelCard
              key={i}
              level={level}
              index={i}
              isLast={i === 2}
              onEdit={() => setEditing(i as 0 | 1 | 2)}
            />
          ))}
        </div>
      )}

      {editing !== null && (
        <LevelDrawer
          index={editing}
          initial={program.levels[editing]}
          isLast={editing === 2}
          onClose={() => setEditing(null)}
          onSaved={(updated) => handleSaved(editing, updated)}
        />
      )}
    </div>
  );
}
