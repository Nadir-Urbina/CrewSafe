const statusStyles: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  "in-review": "bg-amber-100 text-amber-700",
  "review-completed": "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
  new: "New",
  "in-review": "In Review",
  "review-completed": "Review Completed",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            All incident submissions
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "New", value: "—", color: "text-blue-600" },
          { label: "In Review", value: "—", color: "text-amber-600" },
          { label: "Completed", value: "—", color: "text-green-600" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-4 text-center"
          >
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Submissions table — populated in next phase */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Submissions</h2>
          <div className="flex gap-2">
            {Object.entries(statusLabels).map(([key, label]) => (
              <span
                key={key}
                className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[key]}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="p-8 text-center text-slate-400 text-sm">
          Submission list coming soon
        </div>
      </div>
    </div>
  );
}
