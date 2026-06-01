type StatusId = "new" | "review" | "done";
type Size = "sm" | "md";

const STATUS = {
  new:    { label: "New",              color: "var(--cs-info)",    soft: "var(--cs-info-soft)" },
  review: { label: "Under Review",     color: "var(--cs-caution)", soft: "var(--cs-caution-soft)" },
  done:   { label: "Review Completed", color: "var(--cs-safe)",    soft: "var(--cs-safe-soft)" },
} as const;

export default function StatusPill({ status, size = "md" }: { status: StatusId; size?: Size }) {
  const s = STATUS[status];
  const sm = size === "sm";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: s.soft, color: s.color,
      border: `1.5px solid ${s.color}`,
      borderRadius: 999, padding: sm ? "2px 9px" : "4px 12px",
      fontFamily: "var(--font-body)", fontWeight: 700,
      fontSize: sm ? 11 : 12.5, letterSpacing: 0.2,
      textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      <span style={{ width: sm ? 6 : 7, height: sm ? 6 : 7, borderRadius: 999, background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}
