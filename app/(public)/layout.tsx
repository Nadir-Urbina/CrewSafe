import PublicBottomNav from "@/components/ui/PublicBottomNav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--cs-paper)" }}>
      <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        {children}
      </div>
      <PublicBottomNav />
    </div>
  );
}
