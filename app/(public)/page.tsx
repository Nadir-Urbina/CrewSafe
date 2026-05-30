import Link from "next/link";

const incidentTypes = [
  {
    href: "/submit?type=hazard",
    label: "Hazard Recognition",
    color: "bg-orange-50 border-orange-200 text-orange-700",
    iconBg: "bg-orange-100",
    icon: "⚠️",
    description: "Identify and report a safety hazard",
  },
  {
    href: "/submit?type=near-miss",
    label: "Near Miss",
    color: "bg-yellow-50 border-yellow-200 text-yellow-700",
    iconBg: "bg-yellow-100",
    icon: "🔔",
    description: "An incident that almost happened",
  },
  {
    href: "/submit?type=injury-illness",
    label: "Injury / Illness",
    color: "bg-red-50 border-red-200 text-red-700",
    iconBg: "bg-red-100",
    icon: "🩹",
    description: "Report a workplace injury or illness",
  },
  {
    href: "/submit?type=vehicle-accident",
    label: "Vehicle Accident",
    color: "bg-purple-50 border-purple-200 text-purple-700",
    iconBg: "bg-purple-100",
    icon: "🚗",
    description: "Report a vehicle-related incident",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold text-slate-900">
          Report a Safety Incident
        </h1>
        <p className="mt-1 text-slate-500 text-sm">
          Select the incident type to get started
        </p>
      </div>

      {/* Incident type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {incidentTypes.map((type) => (
          <Link
            key={type.href}
            href={type.href}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[.98] ${type.color}`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${type.iconBg}`}
            >
              {type.icon}
            </div>
            <div>
              <div className="font-semibold text-base">{type.label}</div>
              <div className="text-xs mt-0.5 opacity-75">{type.description}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <Link
          href="/reports"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          My Reports
        </Link>
        <Link
          href="/leaderboard"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Leaderboard
        </Link>
      </div>
    </div>
  );
}
