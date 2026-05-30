import BottomNav from "@/components/ui/BottomNav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CS</span>
            </div>
            <span className="font-semibold text-slate-800 text-lg">
              CrewSafe
            </span>
          </div>
        </div>
      </header>

      {/* Page content — padded above bottom nav on mobile */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Bottom navigation — visible on mobile, hidden on md+ */}
      <BottomNav />
    </div>
  );
}
