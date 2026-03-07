'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAnalyticsOverview, listAppointments, listAuditLogs, listPatients, type ApiClientError } from '../lib/api-client';

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
    return value && typeof value === 'object' ? (value as AnyRecord) : null;
}

function asArray(value: unknown): AnyRecord[] {
    if (Array.isArray(value)) {
        return value.map((entry) => asRecord(entry)).filter((entry): entry is AnyRecord => !!entry);
    }
    const record = asRecord(value);
    if (!record) return [];
    const candidates = [record.data, record.items, record.rows];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate.map((entry) => asRecord(entry)).filter((entry): entry is AnyRecord => !!entry);
        }
    }
    return [];
}

function toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value);
    return null;
}

function toString(value: unknown, fallback = '') {
    return typeof value === 'string' ? value : fallback;
}

export default function AiSection() {
    const [overview, setOverview] = useState<AnyRecord>({});
    const [patients, setPatients] = useState<AnyRecord[]>([]);
    const [appointments, setAppointments] = useState<AnyRecord[]>([]);
    const [auditLogs, setAuditLogs] = useState<AnyRecord[]>([]);
    const [syncError, setSyncError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const [overviewResponse, patientsResponse, appointmentsResponse, auditResponse] = await Promise.all([
                    getAnalyticsOverview().catch(() => ({})),
                    listPatients().catch(() => []),
                    listAppointments().catch(() => []),
                    listAuditLogs({ limit: 20 }).catch(() => []),
                ]);
                if (!active) return;
                setOverview(asRecord(overviewResponse) ?? {});
                setPatients(asArray(patientsResponse));
                setAppointments(asArray(appointmentsResponse));
                setAuditLogs(asArray(auditResponse));
                setSyncError(null);
            } catch (error) {
                if (!active) return;
                setSyncError((error as ApiClientError)?.message ?? 'Unable to load AI insights.');
            }
        };
        load();
        return () => {
            active = false;
        };
    }, []);

    const insights = useMemo(() => {
        const totalPatients = toNumber(overview.totalPatients ?? overview.patientCount) ?? patients.length;
        const waiting = appointments.filter((row) => toString(row.status).toLowerCase() === 'waiting').length;
        const completed = appointments.filter((row) => toString(row.status).toLowerCase() === 'completed').length;
        const lastAudit = auditLogs[0];
        const lastAuditAction = lastAudit ? toString(lastAudit.action ?? lastAudit.event, 'Unknown action') : 'No recent logs';
        const lastAuditEntity = lastAudit ? toString(lastAudit.entityType ?? lastAudit.entity, 'system') : 'system';

        return [
            `Current patient base is ${totalPatients}.`,
            `Waiting queue has ${waiting} appointments and ${completed} completed visits.`,
            `Latest audited action: ${lastAuditAction} on ${lastAuditEntity}.`,
            waiting > completed
                ? 'Recommendation: prioritize queue balancing and assistant handover.'
                : 'Recommendation: maintain current consultation throughput.',
        ];
    }, [overview, patients, appointments, auditLogs]);

    return (
        <section id="ai" className="px-4 py-8 md:px-8">
            <div className="mx-auto space-y-5">
                <header>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI Doctor Tools</p>
                    <h1 className="text-3xl font-bold text-slate-900">Live Insight Assistant</h1>
                    <p className="mt-1 text-sm text-slate-600">Derived from realtime analytics, appointments, and audit activity.</p>
                </header>

                {syncError ? (
                    <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">
                        {syncError}
                    </p>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Patients</h2>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{toNumber(overview.totalPatients ?? overview.patientCount) ?? patients.length}</p>
                    </div>
                    <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Appointments</h2>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{appointments.length}</p>
                    </div>
                    <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Audit events</h2>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{auditLogs.length}</p>
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
            </div>
        </section>
    );
}
