import type { CompletedPatient } from "../types";

type AssistantSidebarProps = {
  availableDoctors: { name: string; status: string }[];
  completedSearch: string;
  onCompletedSearchChange: (value: string) => void;
  filteredCompleted: CompletedPatient[];
  onOpenProfile: (profileId?: string | null) => void;
  isLoading?: boolean;
};

export function AssistantSidebar({
  availableDoctors,
  completedSearch,
  onCompletedSearchChange,
  filteredCompleted,
  onOpenProfile,
  isLoading = false,
}: AssistantSidebarProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Available Doctors Today</h2>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Live</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {isLoading ? (
          <p className="text-sm font-semibold text-slate-500">Loading live doctor availability...</p>
        ) : availableDoctors.length ? availableDoctors.map((doc) => (
          <span
            key={doc.name}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              doc.status === "Online" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-slate-100 text-slate-600"
            }`}
          >
            {doc.name}
          </span>
        )) : (
          <p className="text-sm text-slate-500">No doctor availability is published yet.</p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm font-semibold text-slate-900">
        <span>Completed Patient List</span>
        <input
          className="rounded-full border border-slate-200 px-3 py-2 text-xs shadow-inner"
          placeholder="Search patient"
          value={completedSearch}
          onChange={(e) => onCompletedSearchChange(e.target.value)}
        />
      </div>
      <div className="mt-3 space-y-2">
        {filteredCompleted.length ? filteredCompleted.map((entry) => (
          <button
            key={entry.nic}
            type="button"
            onClick={() => onOpenProfile(entry.profileId)}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-700 transition hover:-translate-y-0.5 hover:bg-sky-50 hover:ring-1 hover:ring-sky-200"
          >
            <div>
              <p className="font-semibold text-slate-900">{entry.name}</p>
              <p className="text-[11px] text-slate-500">NIC {entry.nic}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-white">Age {entry.age}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{entry.time}</span>
            </div>
          </button>
        )) : (
          <p className="text-sm text-slate-500">No completed patients match the current search.</p>
        )}
      </div>
    </>
  );
}
