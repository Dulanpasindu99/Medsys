'use client';

import { AsyncNotice, AsyncStatePanel } from '../components/ui/AsyncStatePanel';
import { useAnalyticsSnapshot } from './analytics/hooks/useAnalyticsSnapshot';

export default function AnalyticsSection() {
    const {
        patients,
        appointments,
        encounters,
        inventory,
        loadState,
        reload,
        patientTotal,
        maleTotal,
        femaleTotal,
        appointmentStatusSummary,
        inventoryStock,
        encounterCount,
        completionRate,
    } = useAnalyticsSnapshot();

    return (
        <section id="analytics" className="px-4 py-8 md:px-8">
            <div className="mx-auto space-y-5">
                <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                            <span className="inline-flex h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]" />
                            Insights control room
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Realtime Analytics</h1>
                        <p className="text-sm text-slate-600">Live overview from `/api/analytics/overview` + operational endpoints.</p>
                    </div>
                    <button
                        type="button"
                        onClick={reload}
                        className="ios-button-primary rounded-2xl px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={loadState.status === 'loading'}
                    >
                        {loadState.status === 'loading' ? 'Refreshing...' : 'Refresh metrics'}
                    </button>
                </header>

                {loadState.error ? <AsyncNotice tone="error" message={loadState.error} /> : null}
                {loadState.notice ? <AsyncNotice tone="warning" message={loadState.notice} /> : null}

                {loadState.status === 'loading' ? (
                    <AsyncStatePanel
                        eyebrow="Loading"
                        title="Loading analytics workspace"
                        description="Operational metrics are being aggregated from patients, appointments, encounters, and inventory feeds."
                        tone="loading"
                    />
                ) : loadState.status === 'error' ? (
                    <AsyncStatePanel
                        eyebrow="Error"
                        title="Analytics workspace could not be loaded"
                        description={loadState.error ?? 'Analytics data is unavailable right now.'}
                        tone="error"
                        actionLabel="Retry analytics"
                        onAction={reload}
                    />
                ) : loadState.status === 'empty' ? (
                    <AsyncStatePanel
                        eyebrow="Empty"
                        title="No analytics data available"
                        description="The analytics feeds returned no operational data for this workspace yet."
                        tone="empty"
                    />
                ) : (
                    <>
                        <div className="grid gap-4 lg:grid-cols-4">
                            <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Patients</p>
                                <p className="mt-2 text-3xl font-bold text-slate-900">{patientTotal}</p>
                                <p className="mt-1 text-xs text-slate-500">{maleTotal} male | {femaleTotal} female</p>
                            </div>
                            <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Appointments</p>
                                <p className="mt-2 text-3xl font-bold text-slate-900">{appointments.length}</p>
                                <p className="mt-1 text-xs text-slate-500">{appointmentStatusSummary.waiting} waiting | {appointmentStatusSummary.completed} done</p>
                            </div>
                            <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Encounters</p>
                                <p className="mt-2 text-3xl font-bold text-slate-900">{encounterCount}</p>
                                <p className="mt-1 text-xs text-slate-500">Completion rate: {completionRate}%</p>
                            </div>
                            <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Inventory</p>
                                <p className="mt-2 text-3xl font-bold text-slate-900">{inventoryStock.totalItems}</p>
                                <p className="mt-1 text-xs text-slate-500">{inventoryStock.totalUnits} total units</p>
                            </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Appointment status</h2>
                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-semibold">
                                    <span className="rounded-2xl bg-sky-50 px-4 py-3 text-sky-700 ring-1 ring-sky-100">Waiting: {appointmentStatusSummary.waiting}</span>
                                    <span className="rounded-2xl bg-indigo-50 px-4 py-3 text-indigo-700 ring-1 ring-indigo-100">In consult: {appointmentStatusSummary.in_consultation}</span>
                                    <span className="rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700 ring-1 ring-emerald-100">Completed: {appointmentStatusSummary.completed}</span>
                                    <span className="rounded-2xl bg-rose-50 px-4 py-3 text-rose-700 ring-1 ring-rose-100">Cancelled: {appointmentStatusSummary.cancelled}</span>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Data freshness</h2>
                                <div className="mt-4 space-y-3 text-sm font-semibold text-slate-700">
                                    <p className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-slate-100">Patients feed: {patients.length} rows</p>
                                    <p className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-slate-100">Appointments feed: {appointments.length} rows</p>
                                    <p className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-slate-100">Encounters feed: {encounters.length} rows</p>
                                    <p className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-slate-100">Inventory feed: {inventory.length} rows</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
