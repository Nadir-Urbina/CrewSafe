export type IncidentTypeId = "hazard" | "nearmiss" | "injury" | "vehicle";

const TYPES = {
  hazard:   { color: "var(--cs-caution)",  soft: "var(--cs-caution-soft)", icon: "triangle" },
  nearmiss: { color: "var(--cs-orange)",   soft: "var(--cs-orange-soft)",  icon: "bolt"     },
  injury:   { color: "var(--cs-critical)", soft: "var(--cs-critical-soft)",icon: "cross"    },
  vehicle:  { color: "var(--cs-ink)",      soft: "oklch(0.92 0.012 75)",   icon: "truck"    },
} as const;

function TypeIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const p = { fill: "none", stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const icons: Record<string, React.ReactNode> = {
    triangle: <g {...p}><path d="M12 3.5L22 20H2z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.4" r="0.4" fill={color} stroke="none"/></g>,
    bolt:     <g {...p}><path d="M13.5 3L5 13.5h6L9.5 21 19 10h-6z"/></g>,
    cross:    <g {...p}><path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z"/></g>,
    truck:    <g {...p}><path d="M2 6.5h11v9H2zM13 9.5h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
      {icons[name]}
    </svg>
  );
}

export default function TypeIconBadge({
  typeId,
  size = 44,
  radius = 12,
}: {
  typeId: IncidentTypeId;
  size?: number;
  radius?: number;
}) {
  const t = TYPES[typeId];
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: t.soft, border: `2px solid ${t.color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <TypeIcon name={t.icon} size={size * 0.52} color={t.color} />
    </div>
  );
}

export { TYPES as TYPE_META };
