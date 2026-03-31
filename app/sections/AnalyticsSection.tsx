'use client';

import { useState } from 'react';
import { AsyncNotice, AsyncStatePanel } from '../components/ui/AsyncStatePanel';
import {
  ViewportBody,
  ViewportFrame,
  ViewportHeader,
  ViewportPage,
  ViewportPanel,
  ViewportScrollBody,
  ViewportTabs,
} from '../components/ui/ViewportLayout';
import { useAnalyticsSnapshot } from './analytics/hooks/useAnalyticsSnapshot';

export default function AnalyticsSection() {
  const [activeTab, setActiveTab] = useState<'overview' | 'health'>('overview');
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
    roleContext,
  } = useAnalyticsSnapshot();

  return (
    <ViewportPage>
      <ViewportFrame>
        <ViewportBody className="gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <ViewportHeader
            eyebrow="Insights control room"
            title="Realtime Analytics"
            description={
              roleContext
                ? `Live ${roleContext} overview from \`/api/analytics/overview\` plus operational endpoints.`
                : "Live overview from `/api/analytics/overview` plus operational endpoints."
            }
            actions={
              <button
                type="button"
                onClick={reload}
                className="ios-button-primary rounded-2xl px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loadState.status === 'loading'}
              >
                {loadState.status === 'loading' ? 'Refreshing...' : 'Refresh metrics'}
              </button>
            }
          />
          {roleContext ? (
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-sky-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 ring-1 ring-sky-100">
                Role Context: {roleContext}
              </span>
            </div>
          ) : null}
          <ViewportTabs
            tabs={[
              {
                key: 'overview',
                label: 'Overview',
                active: activeTab === 'overview',
                onClick: () => setActiveTab('overview'),
              },
              {
                key: 'health',
                label: 'Feed Health',
                active: activeTab === 'health',
                onClick: () => setActiveTab('health'),
              },
            ]}
          />

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
            <ViewportScrollBody>
              {activeTab === 'overview' ? (
                <div className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-4">
                    <ViewportPanel>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Patients</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">{patientTotal}</p>
                      <p className="mt-1 text-xs text-slate-500">{maleTotal} male | {femaleTotal} female</p>
                    </ViewportPanel>
                    <ViewportPanel>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Appointments</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">{appointments.length}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {appointmentStatusSummary.waiting} waiting | {appointmentStatusSummary.completed} done
                      </p>
                    </ViewportPanel>
                    <ViewportPanel>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Encounters</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">{encounterCount}</p>
                      <p className="mt-1 text-xs text-slate-500">Completion rate: {completionRate}%</p>
                    </ViewportPanel>
                    <ViewportPanel>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Inventory</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">{inventoryStock.totalItems}</p>
                      <p className="mt-1 text-xs text-slate-500">{inventoryStock.totalUnits} total units</p>
                    </ViewportPanel>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <ViewportPanel>
                      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Appointment status</h2>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-semibold">
                        <span className="rounded-2xl bg-sky-50 px-4 py-3 text-sky-700 ring-1 ring-sky-100">
                          Waiting: {appointmentStatusSummary.waiting}
                        </span>
                        <span className="rounded-2xl bg-indigo-50 px-4 py-3 text-indigo-700 ring-1 ring-indigo-100">
                          In consult: {appointmentStatusSummary.in_consultation}
                        </span>
                        <span className="rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700 ring-1 ring-emerald-100">
                          Completed: {appointmentStatusSummary.completed}
                        </span>
                        <span className="rounded-2xl bg-rose-50 px-4 py-3 text-rose-700 ring-1 ring-rose-100">
                          Cancelled: {appointmentStatusSummary.cancelled}
                        </span>
                      </div>
                    </ViewportPanel>

                    <ViewportPanel>
                      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Data freshness</h2>
                      <div className="mt-4 space-y-3 text-sm font-semibold text-slate-700">
                        <p className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-slate-100">Patients feed: {patients.length} rows</p>
                        <p className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-slate-100">Appointments feed: {appointments.length} rows</p>
                        <p className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-slate-100">Encounters feed: {encounters.length} rows</p>
                        <p className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-slate-100">Inventory feed: {inventory.length} rows</p>
                      </div>
                    </ViewportPanel>
                  </div>
                </div>
              ) : (
                <ViewportPanel>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Operational feed health</h2>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-100">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Patients feed</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{patients.length}</p>
                      <p className="mt-1 text-sm text-slate-600">Rows currently available for demographic and history views.</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-100">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Appointments feed</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{appointments.length}</p>
                      <p className="mt-1 text-sm text-slate-600">Queue and scheduling records flowing into operational dashboards.</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-100">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Encounters feed</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{encounters.length}</p>
                      <p className="mt-1 text-sm text-slate-600">Consultation completions and treatment outcomes available for review.</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-100">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Inventory feed</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{inventory.length}</p>
                      <p className="mt-1 text-sm text-slate-600">Current stock records available for operational and fulfillment decisions.</p>
                    </div>
                  </div>
                </ViewportPanel>
              )}
            </ViewportScrollBody>
          )}
        </ViewportBody>
      </ViewportFrame>
    </ViewportPage>
  );
}
