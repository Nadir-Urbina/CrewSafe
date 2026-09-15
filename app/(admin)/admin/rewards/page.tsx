"use client";

import { useState, useEffect } from "react";
import {
  getRewardTiers, addRewardTier, updateRewardTier,
  type AddRewardTierInput,
} from "@/lib/firebase/rewards";
import { RewardTier } from "@/lib/types";
import HazardStripe from "@/components/ui/HazardStripe";

// ─── Icons ────────────────────────────────────────────────────────────────────
const sp = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function PlusIcon()   { return <svg width={18} height={18} viewBox="0 0 24 24" {...sp}><path d="M12 5v14M5 12h14"/></svg>; }
function XIcon()      { return <svg width={20} height={20} viewBox="0 0 24 24" {...sp}><path d="M6 6l12 12M18 6L6 18"/></svg>; }
function EditIcon()   { return <svg width={16} height={16} viewBox="0 0 24 24" {...sp}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function StarIcon()   { return <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l2.9 8.9H23l-7.5 5.4 2.9 8.9L12 19.8l-6.4 5.4 2.9-8.9L1 11l8.1-.1z"/></svg>; }
function TrophyIcon() { return <svg width={22} height={22} viewBox="0 0 24 24" {...sp}><path d="M8 21h8m-4-4v4M12 17c-4 0-7-3-7-7V5h14v5c0 4-3 7-7 7z"/><path d="M5 9H3a2 2 0 01-2-2V5h4M19 9h2a2 2 0 002-2V5h-4"/></svg>; }

// ─── Tier badge color by rank ─────────────────────────────────────────────────
function tierAccent(index: number) {
  const accents = [
    { bg: "#CD7F32", text: "#fff" },  // bronze
    { bg: "#A8A9AD", text: "#fff" },  // silver
    { bg: "var(--cs-hiviz)", text: "var(--cs-ink)" }, // gold / hiviz
  ];
  return accents[Math.min(index, accents.length - 1)];
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
function Drawer({ title, onClose, children, footer }: {
  title: string; onClose: () => void;
  children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(20,18,14,0.45)", display: "flex", justifyContent: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(480px, 100vw)", height: "100%", background: "var(--cs-paper)", boxShadow: "-20px 0 50px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", animation: "cs-slide .22s ease" }}
      >
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

// ─── Field helpers ─────────────────────────────────────────────────────────────
const inputSx: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 10, padding: "12px 14px", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500, color: "var(--cs-ink)", outline: "none" };
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--cs-ink2)", marginBottom: 7, display: "flex", gap: 5 }}>
      {children}{required && <span style={{ color: "var(--cs-critical)" }}>*</span>}
    </div>
  );
}
function FieldRow({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 18 }}>{children}</div>;
}

// ─── Tier Drawer ──────────────────────────────────────────────────────────────
function TierDrawer({ editing, onClose, onSaved }: {
  editing: RewardTier | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!editing;
  const [name,           setName]           = useState(editing?.name ?? "");
  const [pointsRequired, setPointsRequired] = useState(String(editing?.pointsRequired ?? ""));
  const [description,    setDescription]    = useState(editing?.description ?? "");
  const [active,         setActive]         = useState(editing?.active ?? true);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState("");

  async function handleSave() {
    const pts = parseInt(pointsRequired, 10);
    if (!name.trim())          { setError("Tier name is required."); return; }
    if (!pointsRequired || isNaN(pts) || pts < 1) { setError("Enter a valid points threshold."); return; }
    if (!description.trim())   { setError("Description is required."); return; }

    setSaving(true);
    setError("");
    try {
      const data: AddRewardTierInput = {
        name: name.trim(),
        pointsRequired: pts,
        description: description.trim(),
        active,
      };
      if (isEdit) {
        await updateRewardTier(editing!.id, data);
      } else {
        await addRewardTier(data);
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed. Please try again.");
      setSaving(false);
    }
  }

  return (
    <Drawer
      title={isEdit ? "Edit Tier" : "New Tier"}
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
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Tier"}
          </button>
        </div>
      }
    >
      <FieldRow>
        <Label required>Tier name</Label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bronze Star, Safety Champion"
          style={inputSx}
        />
      </FieldRow>

      <FieldRow>
        <Label required>Points required</Label>
        <input
          type="number"
          min={1}
          value={pointsRequired}
          onChange={(e) => setPointsRequired(e.target.value)}
          placeholder="e.g. 50"
          style={inputSx}
        />
        <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--cs-muted)", marginTop: 6 }}>
          Employees unlock this tier when they reach this point total.
        </div>
      </FieldRow>

      <FieldRow>
        <Label required>Reward description</Label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. $25 gift card + recognition at monthly meeting"
          style={{ ...inputSx, resize: "vertical", lineHeight: 1.55 }}
        />
      </FieldRow>

      <FieldRow>
        <Label>Status</Label>
        <button
          type="button"
          onClick={() => setActive((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", width: "100%", background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 10, cursor: "pointer", textAlign: "left" }}
        >
          <div style={{
            width: 42, height: 24, borderRadius: 12,
            background: active ? "var(--cs-safe)" : "var(--cs-line)",
            transition: "background .2s",
            position: "relative", flexShrink: 0,
          }}>
            <div style={{
              position: "absolute", top: 3, left: active ? 21 : 3,
              width: 18, height: 18, borderRadius: 9, background: "#fff",
              transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            }} />
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, letterSpacing: 0.3, color: "var(--cs-ink)" }}>
            {active ? "Active" : "Inactive"}
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-muted)", marginLeft: "auto" }}>
            {active ? "Visible to employees" : "Hidden from leaderboard"}
          </span>
        </button>
      </FieldRow>
    </Drawer>
  );
}

// ─── Tier Card ────────────────────────────────────────────────────────────────
function TierCard({ tier, index, onEdit, onToggle }: {
  tier: RewardTier;
  index: number;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const accent = tierAccent(index);
  return (
    <div style={{
      background: "var(--cs-card)", border: "2px solid var(--cs-line)",
      borderRadius: 16, overflow: "hidden",
      opacity: tier.active ? 1 : 0.6,
    }}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* Left accent + rank */}
        <div style={{
          width: 72, flexShrink: 0,
          background: accent.bg,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 6, padding: "20px 0",
        }}>
          <div style={{ color: accent.text, opacity: 0.9 }}><StarIcon /></div>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13,
            color: accent.text, textTransform: "uppercase", letterSpacing: 0.4,
          }}>
            Tier {index + 1}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "18px 20px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--cs-ink)", letterSpacing: 0.2 }}>
                {tier.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{
                  background: "var(--cs-hiviz)", color: "var(--cs-ink)",
                  fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13,
                  letterSpacing: 0.3, padding: "2px 10px", borderRadius: 6,
                  border: "1.5px solid var(--cs-ink)",
                }}>
                  {tier.pointsRequired.toLocaleString()} pts
                </span>
                {!tier.active && (
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--cs-muted)", background: "var(--cs-paper-deep)", border: "1.5px solid var(--cs-line)", borderRadius: 6, padding: "2px 8px" }}>
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={onEdit}
                style={{ width: 34, height: 34, borderRadius: 9, background: "var(--cs-paper-deep)", border: "1.5px solid var(--cs-line)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--cs-ink2)", minHeight: 0 }}
                title="Edit tier"
              >
                <EditIcon />
              </button>
              <button
                onClick={onToggle}
                style={{ height: 34, borderRadius: 9, padding: "0 12px", background: tier.active ? "var(--cs-critical-soft)" : "var(--cs-safe-soft)", border: `1.5px solid ${tier.active ? "var(--cs-critical)" : "var(--cs-safe)"}`, cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase", color: tier.active ? "var(--cs-critical)" : "var(--cs-safe)", minHeight: 0, whiteSpace: "nowrap" }}
              >
                {tier.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>

          <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--cs-ink2)", lineHeight: 1.55, marginTop: 10 }}>
            {tier.description}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RewardsPage() {
  const [tiers,   setTiers]   = useState<RewardTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawer,  setDrawer]  = useState<"new" | RewardTier | null>(null);

  async function load() {
    setLoading(true);
    try {
      setTiers(await getRewardTiers());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(tier: RewardTier) {
    await updateRewardTier(tier.id, { active: !tier.active });
    setTiers((prev) => prev.map((t) => t.id === tier.id ? { ...t, active: !t.active } : t));
  }

  function handleSaved() {
    setDrawer(null);
    load();
  }

  const activeTiers   = tiers.filter((t) => t.active);
  const inactiveTiers = tiers.filter((t) => !t.active);

  return (
    <div style={{ padding: "28px 24px", maxWidth: 760, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ color: "var(--cs-hiviz-deep)" }}><TrophyIcon /></div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "var(--cs-ink)", textTransform: "uppercase", letterSpacing: 0.4, margin: 0 }}>
              Reward Tiers
            </h1>
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--cs-muted)", margin: 0 }}>
            Define point thresholds and the rewards employees unlock when they reach them.
          </p>
        </div>
        <button
          onClick={() => setDrawer("new")}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, background: "var(--cs-hiviz)", color: "var(--cs-ink)", border: "2px solid var(--cs-ink)", boxShadow: "0 4px 0 var(--cs-ink)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, letterSpacing: 0.4, textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          <PlusIcon /> New Tier
        </button>
      </div>

      {/* How it works banner */}
      <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 14, overflow: "hidden", marginBottom: 28 }}>
        <HazardStripe height={4} />
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ color: "var(--cs-hiviz-deep)", flexShrink: 0 }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--cs-ink2)", margin: 0, lineHeight: 1.55 }}>
            Employees earn <strong style={{ color: "var(--cs-ink)" }}>1 point per safety submission</strong>. When their total reaches a tier&apos;s threshold, they unlock that reward. Tiers are shown on the leaderboard.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--cs-muted)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, letterSpacing: 0.5, textTransform: "uppercase" }}>
          Loading…
        </div>
      ) : tiers.length === 0 ? (
        /* Empty state */
        <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 16, padding: "56px 24px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--cs-paper-deep)", border: "2px solid var(--cs-line)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--cs-faint)" }}>
            <TrophyIcon />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--cs-ink)", textTransform: "uppercase", letterSpacing: 0.3 }}>
            No reward tiers yet
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--cs-muted)", marginTop: 8, maxWidth: 340, margin: "8px auto 0" }}>
            Create your first tier to start motivating your crew with point-based rewards.
          </div>
          <button
            onClick={() => setDrawer("new")}
            style={{ marginTop: 24, display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: "var(--cs-hiviz)", color: "var(--cs-ink)", border: "2px solid var(--cs-ink)", boxShadow: "0 4px 0 var(--cs-ink)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, letterSpacing: 0.4, textTransform: "uppercase", cursor: "pointer" }}
          >
            <PlusIcon /> Create First Tier
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {activeTiers.map((tier, i) => (
            <TierCard
              key={tier.id}
              tier={tier}
              index={i}
              onEdit={() => setDrawer(tier)}
              onToggle={() => handleToggle(tier)}
            />
          ))}

          {inactiveTiers.length > 0 && (
            <>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cs-muted)", marginTop: 12, paddingLeft: 4 }}>
                Inactive
              </div>
              {inactiveTiers.map((tier, i) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  index={activeTiers.length + i}
                  onEdit={() => setDrawer(tier)}
                  onToggle={() => handleToggle(tier)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Drawer */}
      {drawer !== null && (
        <TierDrawer
          editing={drawer === "new" ? null : drawer}
          onClose={() => setDrawer(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
