'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    getAnalyticsOverview,
    listAppointments,
    listEncounters,
    listInventory,
    listPatients,
    type ApiClientError,
} from '../lib/api-client';

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

export default function AnalyticsSection() {
    const [overview, setOverview] = useState<AnyRecord>({});
    const [patients, setPatients] = useState<AnyRecord[]>([]);
    const [appointments, setAppointments] = useState<AnyRecord[]>([]);
    const [encounters, setEncounters] = useState<AnyRecord[]>([]);
    const [inventory, setInventory] = useState<AnyRecord[]>([]);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadAnalytics = async () => {
        setIsSyncing(true);
        try {
            const [overviewResponse, patientsResponse, appointmentsResponse, encountersResponse, inventoryResponse] = await Promise.all([
                getAnalyticsOverview().catch(() => ({})),
                listPatients().catch(() => []),
                listAppointments().catch(() => []),
                listEncounters().catch(() => []),
                listInventory().catch(() => []),
            ]);
            setOverview(asRecord(overviewResponse) ?? {});
            setPatients(asArray(patientsResponse));
            setAppointments(asArray(appointmentsResponse));
            setEncounters(asArray(encountersResponse));
            setInventory(asArray(inventoryResponse));
            setSyncError(null);
        } catch (error) {
            const message = (error as ApiClientError)?.message ?? 'Unable to load analytics.';
            setSyncError(message);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    const patientTotal = toNumber(overview.totalPatients ?? overview.patientCount) ?? patients.length;
    const maleTotal =
        toNumber(overview.totalMale ?? overview.malePatients) ??
        patients.filter((row) => toString(row.gender).toLowerCase() === 'male').length;
    const femaleTotal =
        toNumber(overview.totalFemale ?? overview.femalePatients) ??
        patients.filter((row) => toString(row.gender).toLowerCase() === 'female').length;

    const appointmentStatusSummary = useMemo(() => {
        const counts = {
            waiting: 0,
            in_consultation: 0,
            completed: 0,
            cancelled: 0,
        };
        appointments.forEach((row) => {
            const status = toString(row.status).toLowerCase();
            if (status in counts) {
                counts[status as keyof typeof counts] += 1;
            }
        });
        return counts;
    }, [appointments]);

    const inventoryStock = useMemo(() => {
        const totalItems = inventory.length;
        const totalUnits = inventory.reduce((sum, row) => sum + (toNumber(row.quantity ?? row.stock ?? row.available) ?? 0), 0);
        return { totalItems, totalUnits };
    }, [inventory]);

    const encounterCount = toNumber(overview.totalEncounters ?? overview.encounterCount) ?? encounters.length;
    const completionRate = appointments.length
        ? Math.round((appointmentStatusSummary.completed / appointments.length) * 100)
        : 0;

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
                        <p className="text-sm text-slate-600">Live overview from `/v1/analytics/overview` + operational endpoints.</p>
                    </div>
                    <button
                        type="button"
                        onClick={loadAnalytics}
                        className="ios-button-primary rounded-2xl px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={isSyncing}
                    >
                        {isSyncing ? 'Refreshing...' : 'Refresh metrics'}
                    </button>
                </header>

                {syncError ? (
                    <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">
                        {syncError}
                    </p>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-4">
                    <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Patients</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{patientTotal}</p>
                        <p className="mt-1 text-xs text-slate-500">{maleTotal} male • {femaleTotal} female</p>
                    </div>
                    <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/70">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Appointments</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{appointments.length}</p>
                        <p className="mt-1 text-xs text-slate-500">{appointmentStatusSummary.waiting} waiting • {appointmentStatusSummary.completed} done</p>
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
            </div>
        </section>
    );
}
