export default function MyReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          View the status of your submitted incidents.
        </p>
      </div>
      {/* Report list — built in next phase */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center text-slate-400">
        Report history coming soon
      </div>
    </div>
  );
}
