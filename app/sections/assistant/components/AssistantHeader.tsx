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
    <header className="flex flex-col gap-3 rounded-[22px] border border-white/80 bg-white/70 px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-slate-900">Assistant Panel</h1>
      </div>
      <div className="grid flex-1 grid-cols-5 gap-2 text-center text-[11px] font-semibold text-slate-700 lg:max-w-[560px]">
        <div className="ios-surface px-2 py-1.5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Total</p>
          <p className="text-base font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="ios-surface px-2 py-1.5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Male</p>
          <p className="text-base font-bold text-slate-900">{stats.male}</p>
        </div>
        <div className="ios-surface px-2 py-1.5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Female</p>
          <p className="text-base font-bold text-slate-900">{stats.female}</p>
        </div>
        <div className="ios-surface px-2 py-1.5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Existing</p>
          <p className="text-base font-bold text-slate-900">{stats.existing}</p>
        </div>
        <div className="ios-surface px-2 py-1.5 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">New</p>
          <p className="text-base font-bold text-slate-900">{stats.new}</p>
        </div>
      </div>
    </header>
  );
}
