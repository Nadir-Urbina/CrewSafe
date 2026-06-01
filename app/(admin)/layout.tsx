import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--cs-paper)" }}>
        {/* Sidebar (desktop) / top bar (mobile) */}
        <AdminSidebar />

        {/* Main content */}
        <main style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, padding: "24px", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
