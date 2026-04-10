import { TopChip } from "./PatientPrimitives";

export function PatientHeader() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
        <span className="inline-flex h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]" />
        Patient hub
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Patient Management</h1>
          <p className="text-sm text-slate-600">Search, filter, and review patient families in one place.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
          <TopChip>Patients</TopChip>
          <TopChip>Families</TopChip>
          <TopChip>Filters</TopChip>
        </div>
      </div>
    </div>
  );
}
