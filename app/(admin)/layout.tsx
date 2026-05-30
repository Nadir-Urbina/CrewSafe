import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        {/* Mobile nav tabs */}
        <div className="flex flex-col flex-1 min-w-0">
          <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
            {children}
          </main>

          {/* Mobile bottom nav for admin */}
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-[#1e3a5f] flex">
            <a href="/admin" className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs text-white/70">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Dashboard
            </a>
            <a href="/admin/employees" className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs text-white/70">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Employees
            </a>
            <a href="/admin/rewards" className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs text-white/70">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              Rewards
            </a>
          </nav>
        </div>
      </div>
    </AdminGuard>
  );
}
