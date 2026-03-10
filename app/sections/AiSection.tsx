'use client';

import { AsyncNotice, AsyncStatePanel } from '../components/ui/AsyncStatePanel';
import { useAiInsightsData } from './ai/hooks/useAiInsightsData';

export default function AiSection() {
    const { patientTotal, appointmentTotal, auditEventCount, insights, loadState, reload } = useAiInsightsData();

    return (
        <section id="ai" className="px-4 py-8 md:px-8">
            <div className="mx-auto space-y-5">
                <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI Doctor Tools</p>
                        <h1 className="text-3xl font-bold text-slate-900">Live Insight Assistant</h1>
                        <p className="mt-1 text-sm text-slate-600">Derived from realtime analytics, appointments, and audit activity.</p>
                    </div>
                    <button
                        type="button"
                        onClick={reload}
                        className="ios-button-primary rounded-2xl px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={loadState.status === 'loading'}
                    >
                        {loadState.status === 'loading' ? 'Refreshing...' : 'Refresh insights'}
                    </button>
                </header>

                {loadState.error ? <AsyncNotice tone="error" message={loadState.error} /> : null}
                {loadState.notice ? <AsyncNotice tone="warning" message={loadState.notice} /> : null}

                {loadState.status === 'loading' ? (
                    <AsyncStatePanel
                        eyebrow="Loading"
                        title="Preparing AI insights"
                        description="Analytics, appointment activity, and audit events are being summarized into the AI workspace."
                        tone="loading"
                    />
                ) : loadState.status === 'error' ? (
                    <AsyncStatePanel
                        eyebrow="Error"
                        title="AI insights could not be loaded"
                        description={loadState.error ?? 'The AI insights workspace is unavailable right now.'}
                        tone="error"
                        actionLabel="Retry insights"
                        onAction={reload}
                    />
                ) : loadState.status === 'empty' ? (
                    <AsyncStatePanel
                        eyebrow="Empty"
                        title="No insight data available"
                        description="There is not enough operational data yet to generate AI guidance."
                        tone="empty"
                    />
                ) : (
                    <>
                        <div className="grid gap-4 lg:grid-cols-3">
                            <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Patients</h2>
                                <p className="mt-2 text-3xl font-bold text-slate-900">{patientTotal}</p>
                            </div>
                            <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Appointments</h2>
                                <p className="mt-2 text-3xl font-bold text-slate-900">{appointmentTotal}</p>
                            </div>
                            <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Audit events</h2>
                                <p className="mt-2 text-3xl font-bold text-slate-900">{auditEventCount}</p>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Generated insights</h2>
                            <div className="mt-4 space-y-3">
                                {insights.map((line, index) => (
                                    <p key={index} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
