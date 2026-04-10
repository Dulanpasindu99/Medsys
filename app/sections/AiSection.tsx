'use client';

import { useState } from 'react';
import { AsyncStatePanel } from '../components/ui/AsyncStatePanel';
import {
  ViewportBody,
  ViewportFrame,
  ViewportHeader,
  ViewportPage,
  ViewportPanel,
  ViewportScrollBody,
  ViewportTabs,
} from '../components/ui/ViewportLayout';
import { useAiInsightsData } from './ai/hooks/useAiInsightsData';

export default function AiSection() {
  const [activeTab, setActiveTab] = useState<'snapshot' | 'insights'>('snapshot');
  const { patientTotal, appointmentTotal, auditEventCount, roleContext, insights, loadState, reload } = useAiInsightsData();

  return (
    <ViewportPage>
      <ViewportFrame>
        <ViewportBody className="gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <ViewportHeader
            eyebrow="AI doctor tools"
            title="Live Insight Assistant"
            description={
              roleContext
                ? `Derived from realtime analytics, appointments, and audit activity for the ${roleContext} role.`
                : "Derived from realtime analytics, appointments, and audit activity."
            }
            actions={
              <button
                type="button"
                onClick={reload}
                className="ios-button-primary rounded-2xl px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loadState.status === 'loading'}
              >
                {loadState.status === 'loading' ? 'Refreshing...' : 'Refresh insights'}
              </button>
            }
          />
          {roleContext ? (
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-100">
                Role Context: {roleContext}
              </span>
            </div>
          ) : null}
          <ViewportTabs
            tabs={[
              {
                key: 'snapshot',
                label: 'Snapshot',
                active: activeTab === 'snapshot',
                onClick: () => setActiveTab('snapshot'),
              },
              {
                key: 'insights',
                label: 'Insights',
                active: activeTab === 'insights',
                onClick: () => setActiveTab('insights'),
              },
            ]}
          />

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
            <ViewportScrollBody>
              {activeTab === 'snapshot' ? (
                <div className="grid gap-4 lg:grid-cols-3">
                  <ViewportPanel>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Patients</h2>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{patientTotal}</p>
                  </ViewportPanel>
                  <ViewportPanel>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Appointments</h2>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{appointmentTotal}</p>
                  </ViewportPanel>
                  <ViewportPanel>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Audit events</h2>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{auditEventCount}</p>
                  </ViewportPanel>
                </div>
              ) : (
                <ViewportPanel>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Generated insights</h2>
                  <div className="mt-4 space-y-3">
                    {insights.map((line, index) => (
                      <p key={`${line}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
                        {line}
                      </p>
                    ))}
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
