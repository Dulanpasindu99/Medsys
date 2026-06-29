type AssistantHeaderProps = {
  stats: {
    total: number;
    male: number;
    female: number;
    existing: number;
    new: number;
  };
};

export function AssistantHeader({ stats }: AssistantHeaderProps) {
  return (
    <header className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(15,23,42,0.05)] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-sky-500" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-slate-900">Assistant Panel</h1>
      </div>
      <div className="grid flex-1 grid-cols-5 gap-2 text-center text-[11px] font-semibold text-slate-700 lg:max-w-[560px]">
        {[
          { label: "Total", value: stats.total },
          { label: "Male", value: stats.male },
          { label: "Female", value: stats.female },
          { label: "Existing", value: stats.existing },
          { label: "New", value: stats.new },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/70 px-2 py-1.5">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">{item.label}</p>
            <p className="text-base font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>
    </header>
  );
}
