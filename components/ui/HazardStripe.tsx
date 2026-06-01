export default function HazardStripe({ height = 10 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        background:
          "repeating-linear-gradient(-45deg, var(--cs-ink) 0 14px, var(--cs-hiviz) 14px 28px)",
        flexShrink: 0,
      }}
    />
  );
}
