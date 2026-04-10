import type React from "react";

type ViewportPageProps = {
  children: React.ReactNode;
  className?: string;
};

type ViewportHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

type ViewportTabsProps = {
  tabs: Array<{
    key: string;
    label: string;
    active?: boolean;
    onClick: () => void;
  }>;
  className?: string;
};

export function ViewportPage({ children, className = "" }: ViewportPageProps) {
  return (
    <section className={`flex h-full min-h-0 flex-col overflow-visible px-0 py-2 md:px-1 md:py-3 lg:overflow-hidden ${className}`}>
      {children}
    </section>
  );
}

export function ViewportFrame({ children, className = "" }: ViewportPageProps) {
  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-white/55 bg-white/82 shadow-[0_26px_60px_rgba(15,23,42,0.12)] ring-1 ring-white/65 backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export function ViewportBody({ children, className = "" }: ViewportPageProps) {
  return <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${className}`}>{children}</div>;
}

export function ViewportScrollBody({ children, className = "" }: ViewportPageProps) {
  return <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${className}`}>{children}</div>;
}

export function ViewportPanel({ children, className = "" }: ViewportPageProps) {
  return (
    <div
      className={`rounded-3xl border border-white/80 bg-white/90 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70 sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function ViewportHeader({
  eyebrow,
  title,
  description,
  actions,
  className = "",
}: ViewportHeaderProps) {
  return (
    <header className={`flex flex-col gap-3 md:flex-row md:items-start md:justify-between ${className}`}>
      <div className="space-y-2">
        {eyebrow ? (
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            <span className="inline-flex h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]" />
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{title}</h1>
        {description ? <p className="max-w-3xl text-sm text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function ViewportTabs({ tabs, className = "" }: ViewportTabsProps) {
  return (
    <div className={`mobile-visible-x-scroll flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={tab.onClick}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition xl:px-4 xl:py-2 xl:text-[11px] xl:tracking-[0.16em] ${
            tab.active
              ? "bg-slate-800 text-white shadow-md"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
          aria-pressed={tab.active}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
