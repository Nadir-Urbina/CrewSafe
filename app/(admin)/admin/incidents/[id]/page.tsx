import Link from "next/link";

export default async function IncidentDetailPage(props: PageProps<"/admin/incidents/[id]">) {
  const { id } = await props.params;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Incident #{id}</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Review details and manage investigation
        </p>
      </div>

      {/* Detail cards — populated in next phase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-3">
              Incident Details
            </h2>
            <div className="text-sm text-slate-400">Loading…</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-3">
              Investigation Notes
            </h2>
            <div className="text-sm text-slate-400">Notes editor coming soon</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-3">Status</h2>
            <div className="text-sm text-slate-400">Status controls coming soon</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-3">Actions</h2>
            <div className="space-y-2">
              <button disabled className="w-full py-2 rounded-lg bg-slate-100 text-slate-400 text-sm font-medium cursor-not-allowed">
                Forward via Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
