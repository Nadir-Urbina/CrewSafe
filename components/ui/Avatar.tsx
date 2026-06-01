function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function Avatar({
  name,
  size = 40,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      background: color ?? "var(--cs-ink)", color: "var(--cs-hiviz)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-display)", fontWeight: 700, fontSize: size * 0.4,
      letterSpacing: 0.5,
    }}>
      {initials(name)}
    </div>
  );
}
