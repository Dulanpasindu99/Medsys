'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { ReportType } from '../lib/api-client';
import { AppSelectField } from '../components/ui/AppSelectField';
import { AsyncStatePanel } from '../components/ui/AsyncStatePanel';
import {
  ViewportBody,
  ViewportFrame,
  ViewportHeader,
  ViewportPage,
  ViewportTabs,
} from '../components/ui/ViewportLayout';
import {
  isAssistantAnalytics,
  isDoctorAnalytics,
  isOwnerAnalytics,
  type AnalyticsDashboardResponse,
} from '../lib/analytics-types';
import {
  useDailySummaryHistoryQuery,
  useDailySummaryQuery,
  useReportsQuery,
} from '../lib/query-hooks';
import { useAnalyticsDashboard } from './analytics/hooks/useAnalyticsDashboard';
import {
  AnalyticsCard,
  BarChartCard,
  DonutChartCard,
  FunnelChartCard,
  InsightsCard,
  LineChartCard,
  MetricStrip,
  StackedBarChartCard,
  TableCard,
} from './analytics/components/AnalyticsPrimitives';

type RoleDashboardTab = {
  key: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  summaryKeys?: string[];
  chartKeys?: string[];
  tableKeys?: string[];
  showInsights?: boolean;
  showAlerts?: boolean;
};

type MetricItem = {
  label: string;
  value: unknown;
};

type InsightItem = {
  id: string;
  message: string;
  level?: string;
};

type AnalyticsWorkspaceMode = 'dashboard' | 'reports';
type DailySummaryTab = 'summary' | 'history';

function EmptyTabState({ message }: { message: string }) {
  return (
    <AnalyticsCard eyebrow="No Data" title="Nothing To Show Yet">
      <p className="text-sm leading-6 text-slate-600">{message}</p>
    </AnalyticsCard>
  );
}

function getChartGridClass(count: number) {
  if (count >= 3) {
    return 'grid auto-rows-fr items-stretch gap-3 xl:grid-cols-3';
  }
  if (count === 2) {
    return 'grid auto-rows-fr items-stretch gap-3 xl:grid-cols-2';
  }
  return 'grid auto-rows-fr items-stretch gap-3';
}

function getTabContentLayoutClass(hasSideColumn: boolean, chartCount: number, tableCount: number) {
  if (!hasSideColumn) {
    return chartCount >= 3 && tableCount === 0
      ? 'space-y-3'
      : 'grid auto-rows-fr items-stretch gap-3';
  }

  return 'grid auto-rows-fr items-stretch gap-3 xl:grid-cols-[minmax(280px,0.82fr)_minmax(0,1.55fr)]';
}

function toTitleCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const METRIC_LABELS: Record<string, string> = {
  newPatientsToday: 'New Patients',
  newPatients: 'New Patients',
  returningPatientsToday: 'Returning Patients',
  returningPatients: 'Returning Patients',
  repeatPatients: 'Returning Patients',
  minorPatientsCount: 'Minor Patients',
  minors: 'Minor Patients',
  guardianLinkedPatients: 'Guardian Linked',
  guardianLinked: 'Guardian Linked',
  familyLinkedPatients: 'Family Linked',
  familyLinked: 'Family Linked',
  repeatVisitRate: 'Repeat Rate',
  followUpDuePatients: 'Follow-Up Due',
  highRiskPatients: 'High-Risk',
  totalEncounters: 'Encounters',
  encounters: 'Encounters',
  patientsWithAllergies: 'With Allergies',
  allergyFlagCount: 'Allergy Flags',
  patientsWithAbnormalVitals: 'Abnormal Vitals',
  abnormalVitalsCount: 'Abnormal Vitals',
  clinicalPrescriptionsCount: 'Clinical Rx',
  clinicalPrescriptions: 'Clinical Rx',
  outsidePrescriptionsCount: 'Outside Rx',
  outsidePrescriptions: 'Outside Rx',
  directDispenseCount: 'Direct Dispense',
  lowStockRelevantCount: 'Low Stock',
  lowStockRelevantMedicines: 'Low Stock',
  unmatchedPrescriptionItemsCount: 'Unmatched Rx',
  dispenseCompletionRate: 'Dispense Rate',
};

function formatMetricLabel(key: string) {
  return METRIC_LABELS[key] ?? toTitleCase(key);
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function reportFieldValue(value: unknown) {
  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return '--';
}

function formatVisitMode(value: string) {
  return value === 'walk_in' ? 'Walk-in' : value === 'appointment' ? 'Appointment' : value;
}

function formatWorkflowMode(value: string) {
  return value === 'self_service'
    ? 'Self Service'
    : value === 'clinic_supported'
      ? 'Clinic Supported'
      : value;
}

function formatDetailLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function flattenSummaryMetrics(
  summary: Record<string, unknown>,
  maxItems = 8
): Array<{ label: string; value: unknown }> {
  const direct = Object.entries(summary)
    .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
    .map(([key, value]) => ({
      label: formatMetricLabel(key),
      value,
    }));

  const nested = Object.entries(summary).flatMap(([, value]) => {
    const record = asRecord(value);
    if (!record) return [];
    return Object.entries(record)
      .filter(([, nestedValue]) => typeof nestedValue === 'number' || typeof nestedValue === 'string')
      .map(([key, nestedValue]) => ({
        label: formatMetricLabel(key),
        value: nestedValue,
      }));
  });

  const seen = new Set<string>();
  return [...direct, ...nested]
    .filter((item) => {
      if (seen.has(item.label)) return false;
      seen.add(item.label);
      return true;
    })
    .slice(0, maxItems);
}

function toInsightRows(value: unknown) {
  if (!Array.isArray(value)) return [] as InsightItem[];
  return value
    .map((entry, index): InsightItem | null => {
      if (!entry || typeof entry !== 'object') return null;
      const row = entry as Record<string, unknown>;
      const message =
        typeof row.message === 'string'
          ? row.message
          : typeof row.text === 'string'
            ? row.text
            : typeof row.note === 'string'
              ? row.note
              : '';
      if (!message) return null;
      return {
        id: String(row.id ?? `insight-${index}`),
        message,
        level: typeof row.level === 'string' ? row.level : undefined,
      };
    })
    .filter((entry): entry is InsightItem => entry !== null);
}

function getMetricItems(section: unknown) {
  const record = asRecord(section);
  if (!record) return [];

  return Object.entries(record)
    .filter(([, value]) => value === null || typeof value === 'number' || typeof value === 'string' || Array.isArray(value))
    .map(([key, value]) => ({
      label: formatMetricLabel(key),
      value:
        typeof value === 'number' || typeof value === 'string'
          ? value
          : Array.isArray(value)
            ? value.length
            : '--',
    }));
}

function getNumberValue(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function getStringValue(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return null;
}

function getFirstChartLabel(chartData: unknown) {
  if (!Array.isArray(chartData) || !chartData.length) {
    return null;
  }

  const first = chartData[0];
  if (!first || typeof first !== 'object') {
    return null;
  }

  const record = first as Record<string, unknown>;
  return typeof record.label === 'string' ? record.label : null;
}

function getChartTotal(chartData: unknown) {
  if (!Array.isArray(chartData)) {
    return null;
  }

  const values = chartData
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      return getNumberValue(entry as Record<string, unknown>, ['count', 'value']);
    })
    .filter((value): value is number => value !== null);

  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
}

function getDoctorKpiMetrics(data: AnalyticsDashboardResponse): MetricItem[] {
  const summary = data.summary ?? {};
  const patientMix = asRecord(summary.patientMix);
  const clinical = asRecord(summary.clinical);
  const prescribing = asRecord(summary.prescribing);
  const charts = data.charts ?? {};

  const newPatients = getNumberValue(patientMix, ['newPatients']);
  const returningPatients = getNumberValue(patientMix, ['returningPatients', 'repeatPatients']);
  const totalPatients =
    getNumberValue(patientMix, ['patientsToday', 'totalPatients']) ??
    getChartTotal(charts.newVsReturning) ??
    getChartTotal(charts.genderSplit) ??
    (typeof newPatients === 'number' || typeof returningPatients === 'number'
      ? (newPatients ?? 0) + (returningPatients ?? 0)
      : null);
  const repeatRate =
    getNumberValue(patientMix, ['repeatVisitRate']) ??
    (typeof totalPatients === 'number' && totalPatients > 0 && typeof returningPatients === 'number'
      ? Math.round((returningPatients / totalPatients) * 100)
      : null);
  const topDiagnosis =
    getStringValue(clinical, ['topDiagnosisLabel']) ?? getFirstChartLabel(charts.topDiagnoses);
  const topDrug =
    getStringValue(prescribing, ['topMedicineLabel', 'topDrugLabel']) ??
    getFirstChartLabel(charts.topMedications) ??
    getFirstChartLabel(charts.topDispensedMedicines);

  return [
    { label: 'Patients', value: totalPatients ?? '--' },
    { label: 'Repeat %', value: typeof repeatRate === 'number' ? `${repeatRate}%` : '--' },
    { label: 'Top Diagnosis', value: topDiagnosis ?? '--' },
    { label: 'Top Drug', value: topDrug ?? '--' },
  ];
}

function getChartCountForLabel(chartData: unknown, targetLabel: string) {
  if (!Array.isArray(chartData)) {
    return null;
  }

  for (const entry of chartData) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    if (String(row.label ?? '').toLowerCase() === targetLabel.toLowerCase()) {
      return getNumberValue(row, ['count', 'value']);
    }
  }

  return null;
}

function buildDoctorInsights(data: AnalyticsDashboardResponse): InsightItem[] {
  const items: InsightItem[] = [];
  const summary = data.summary ?? {};
  const charts = data.charts ?? {};
  const patientMix = asRecord(summary.patientMix);
  const clinical = asRecord(summary.clinical);
  const topDiagnosis = getFirstChartLabel(charts.topDiagnoses);
  const topTest = getFirstChartLabel(charts.topTests);
  const outsideDrugCount = getChartCountForLabel(charts.prescriptionSourceSplit, 'outside');
  const outsideClinicalCount = getChartCountForLabel(charts.prescriptionSourceSplit, 'clinical');
  const repeatRate =
    getNumberValue(patientMix, ['repeatVisitRate']) ??
    (() => {
      const returning = getNumberValue(patientMix, ['returningPatients', 'repeatPatients']);
      const total = getNumberValue(patientMix, ['patientsToday', 'totalPatients']);
      if (returning !== null && total && total > 0) {
        return Math.round((returning / total) * 100);
      }
      return null;
    })();
  const minorPatients = getNumberValue(patientMix, ['minorPatientsCount', 'minors']);

  if (topDiagnosis) {
    items.push({
      id: 'doctor-top-diagnosis',
      message: `${topDiagnosis} is the leading diagnosis in this range.`,
      level: 'info',
    });
  }

  if (outsideDrugCount && outsideDrugCount > 0) {
    items.push({
      id: 'doctor-outside-drugs',
      message: `${outsideDrugCount} prescriptions came from outside sources${outsideClinicalCount ? ` versus ${outsideClinicalCount} clinical prescriptions` : ''}.`,
      level: 'warning',
    });
  }

  if (topTest) {
    items.push({
      id: 'doctor-top-test',
      message: `${topTest} is the most requested investigation and may point to more outside test follow-up.`,
      level: 'info',
    });
  }

  if (repeatRate !== null && repeatRate >= 40) {
    items.push({
      id: 'doctor-repeat-rate',
      message: `Repeat visits are at ${repeatRate}% in this range, which may indicate more chronic follow-up activity.`,
      level: 'success',
    });
  }

  if (minorPatients && minorPatients > 0) {
    items.push({
      id: 'doctor-minor-patients',
      message: `${minorPatients} minor patient records were seen in this range, so age-linked pattern review may be useful.`,
      level: 'info',
    });
  }

  return items;
}

function getGeneratedLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-GB');
}

function renderChartByKey(title: string, chartKey: string, chartData: unknown) {
  if (!chartData) return null;

  if (chartKey.toLowerCase().includes('funnel')) {
    return <FunnelChartCard key={chartKey} title={title} data={chartData} />;
  }

  if (
    chartKey.toLowerCase().includes('split') ||
    chartKey.toLowerCase().includes('distribution')
  ) {
    return <DonutChartCard key={chartKey} title={title} data={chartData} />;
  }

  if (
    chartKey.toLowerCase().includes('trend') ||
    chartKey.toLowerCase().includes('byday') ||
    chartKey.toLowerCase().includes('prescriptionsbyday')
  ) {
    return <LineChartCard key={chartKey} title={title} data={chartData} />;
  }

  if (chartKey.toLowerCase().includes('completeness')) {
    return <StackedBarChartCard key={chartKey} title={title} data={chartData} />;
  }

  return <BarChartCard key={chartKey} title={title} data={chartData} />;
}

function getRoleTabs(data: AnalyticsDashboardResponse): RoleDashboardTab[] {
  if (isDoctorAnalytics(data)) {
    return [
      {
        key: 'overview',
        label: 'Overview',
        eyebrow: 'Clinical Overview',
        title: 'Clinical Awareness Snapshot',
        description:
          'A doctor-first summary of who is being treated, what conditions are appearing most, and which clinical patterns stand out right now.',
        summaryKeys: ['patientMix', 'clinical', 'prescribing'],
        chartKeys: ['genderSplit', 'ageGroups', 'newVsReturning', 'topDiagnoses'],
      },
      {
        key: 'diagnoses',
        label: 'Diagnoses',
        eyebrow: 'Diagnosis Intelligence',
        title: 'Diagnosis Patterns And Spread',
        description:
          'This is the core doctor insight area for seeing the most common diagnoses, the related investigation pattern, and whether any condition trend is rising.',
        summaryKeys: ['clinical'],
        chartKeys: ['topDiagnoses', 'topTests'],
        tableKeys: ['recentEncounters'],
      },
      {
        key: 'prescriptions',
        label: 'Prescriptions',
        eyebrow: 'Prescription Analysis',
        title: 'Medicine Usage And Prescription Trends',
        description:
          'Review medicine usage, prescription frequency, repeat prescribing behavior, and the balance between clinical and outside prescriptions.',
        summaryKeys: ['prescribing'],
        chartKeys: ['topMedications', 'prescriptionSourceSplit', 'prescriptionsByDay'],
      },
      {
        key: 'records',
        label: 'Patients',
        eyebrow: 'Patient Records',
        title: 'Patient Recall And Comparison',
        description:
          'Use the patient-facing tables for quick recall of diagnoses, medicines, visit history, and last-visit patterns without crowding the chart area.',
        tableKeys: ['recentEncounters', 'followUps'],
      },
    ];
  }

  if (isAssistantAnalytics(data)) {
    return [
      {
        key: 'intake',
        label: 'Intake',
        eyebrow: 'Intake + Registration',
        title: 'Registration And Intake Performance',
        description:
          'Track patient registrations, walk-ins created, new family and guardian links, and intake speed across the selected period.',
        summaryKeys: ['intake'],
        chartKeys: ['registrationsByHour', 'dailyIntakeTrend'],
      },
      {
        key: 'queue',
        label: 'Queue',
        eyebrow: 'Queue + Scheduling',
        title: 'Queue And Scheduling Pressure',
        description:
          'Monitor waiting movement, doctor-wise queue load, delayed visits, and the split between walk-ins and booked appointments.',
        summaryKeys: ['queue'],
        chartKeys: ['appointmentsByDoctor', 'queueStatusSplit'],
        tableKeys: ['doctorLoad', 'delayedQueue'],
      },
      {
        key: 'dispense',
        label: 'Dispense',
        eyebrow: 'Dispense + Handover',
        title: 'Dispense Status And Follow-through',
        description:
          'Keep pending prescriptions, completed dispense work, delayed handovers, and dispense blockers in one operational area.',
        summaryKeys: ['dispense'],
        chartKeys: ['dispenseStatusSplit'],
        tableKeys: ['pendingDispense'],
        showAlerts: true,
      },
      {
        key: 'coordination',
        label: 'Coordination',
        eyebrow: 'Staff Coordination',
        title: 'Coordination Snapshot',
        description:
          'This tab keeps only the assistant coordination tables and supporting data without pushing insights into a separate view.',
        tableKeys: ['doctorLoad', 'pendingDispense', 'delayedQueue'],
      },
    ];
  }

  if (isOwnerAnalytics(data)) {
    return [
      {
        key: 'growth',
        label: 'Growth',
        eyebrow: 'Organization Growth',
        title: 'Patient And Encounter Growth',
        description:
          'Track total patients, new patients, repeat patients, families, and overall encounter growth across the organization.',
        summaryKeys: ['organizationGrowth'],
        chartKeys: ['growthTrend'],
        showInsights: true,
      },
      {
        key: 'operations',
        label: 'Operations',
        eyebrow: 'Operational Performance',
        title: 'Operational Performance And Demand',
        description:
          'Review completion rate, wait times, consultation duration, appointment movement, and the busiest operating windows.',
        summaryKeys: ['operationalPerformance'],
        chartKeys: ['appointmentStatusDistribution', 'busyHours'],
      },
      {
        key: 'doctors',
        label: 'Doctors',
        eyebrow: 'Doctor Performance',
        title: 'Doctor Workload And Output',
        description:
          'Compare patient load, throughput, and role-specific performance across the doctor team.',
        chartKeys: ['doctorWorkloadComparison'],
        tableKeys: ['doctorPerformance'],
      },
      {
        key: 'assistants',
        label: 'Assistants',
        eyebrow: 'Assistant Performance',
        title: 'Assistant Throughput And Coordination',
        description:
          'Review registration and coordination throughput across assistants without mixing it into owner-wide totals.',
        chartKeys: ['assistantThroughputComparison'],
        tableKeys: ['assistantPerformance'],
      },
      {
        key: 'quality',
        label: 'Quality',
        eyebrow: 'Patient Quality + Safety',
        title: 'Quality, Safety, And Completion',
        description:
          'Surface care-quality gaps, abnormal-vitals patterns, linkage quality, and completion issues that need owner attention first.',
        summaryKeys: ['quality'],
        chartKeys: ['completionQualityAcrossRoles'],
        showAlerts: true,
      },
      {
        key: 'inventory',
        label: 'Inventory',
        eyebrow: 'Inventory + Operational Health',
        title: 'Inventory Risk And Consumption',
        description:
          'Keep low-stock risk, fast-moving medicines, and inventory-side operational pressure in a dedicated owner view.',
        summaryKeys: ['inventory'],
        chartKeys: ['lowStockAndTopConsumed'],
        tableKeys: ['lowStockItems', 'operationalExceptions'],
      },
    ];
  }

  return [];
}

function DashboardHero({
  resolvedRole,
  controls,
  eyebrow = 'Dashboard Scope',
  title,
  description,
}: {
  resolvedRole: string | null;
  controls: React.ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  return (
    <AnalyticsCard
      eyebrow={eyebrow}
      title={title ?? (resolvedRole ? `${toTitleCase(resolvedRole)} Dashboard` : 'Realtime Dashboard')}
      className="h-auto border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,255,0.94))]"
    >
      <div className="grid items-center gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)]">
        <div className="space-y-1.5">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {eyebrow}
          </p>
          <p className="max-w-2xl text-[0.74rem] leading-5 text-slate-600">
            {description ??
              (resolvedRole === 'doctor'
                ? 'Clinical analytics for demographics, diagnoses, prescriptions, tests, and patient recall.'
                : 'Role-based analytics grouped into a cleaner and more focused workspace.')}
          </p>
        </div>

        <div className="grid content-start gap-2 sm:grid-cols-3">
          {controls}
        </div>
      </div>
    </AnalyticsCard>
  );
}

function DoctorPatientShortcut() {
  return (
    <div className="flex items-center justify-between rounded-[20px] border border-sky-100 bg-sky-50/80 px-4 py-3 text-slate-700 ring-1 ring-sky-100">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
          Doctor Shortcut
        </p>
        <p className="mt-1 text-sm font-medium">
          Open the full patient management workspace to inspect complete patient details and history.
        </p>
      </div>
      <Link
        href="/patient"
        className="inline-flex shrink-0 items-center rounded-full bg-slate-900 px-3 py-2 text-[0.75rem] font-semibold text-white transition hover:bg-slate-800"
      >
        Go To Patient Management
      </Link>
    </div>
  );
}

function ScopeField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/92 px-3 py-2 ring-1 ring-slate-100">
      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="mt-1 text-[0.74rem] font-semibold text-slate-800">{children}</div>
    </div>
  );
}

function AnalyticsSectionBlock({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 border-b border-slate-200/80 pb-2.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950 sm:text-xl">{title}</h3>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

function getReportOptionsForRole(role: string | null): Array<{ key: ReportType; label: string }> {
  if (role === 'doctor') {
    return [
      { key: 'doctor-performance', label: 'Doctor Performance' },
      { key: 'patient-followup', label: 'Patient Follow-up' },
    ];
  }

  if (role === 'assistant') {
    return [
      { key: 'assistant-performance', label: 'Assistant Performance' },
      { key: 'inventory-usage', label: 'Inventory Usage' },
    ];
  }

  return [
    { key: 'clinic-overview', label: 'Clinic Overview' },
    { key: 'doctor-performance', label: 'Doctor Performance' },
    { key: 'assistant-performance', label: 'Assistant Performance' },
    { key: 'inventory-usage', label: 'Inventory Usage' },
    { key: 'patient-followup', label: 'Patient Follow-up' },
  ];
}

function getReportMeta(reportType: ReportType) {
  switch (reportType) {
    case 'clinic-overview':
      return {
        eyebrow: 'Clinic Overview',
        title: 'Clinic Overview Report',
        description: 'High-level appointment status and recent appointment activity across the organization.',
        chartKey: 'appointmentStatusDistribution',
        tableKeys: ['recentAppointments'],
      };
    case 'doctor-performance':
      return {
        eyebrow: 'Doctor Performance',
        title: 'Doctor Performance Report',
        description: 'Doctor workload and encounter performance from the new reports service.',
        chartKey: 'encountersByDoctor',
        tableKeys: ['doctors'],
      };
    case 'assistant-performance':
      return {
        eyebrow: 'Assistant Performance',
        title: 'Assistant Performance Report',
        description: 'Assistant throughput and operational support performance.',
        chartKey: 'throughputByAssistant',
        tableKeys: ['assistants'],
      };
    case 'inventory-usage':
      return {
        eyebrow: 'Inventory Usage',
        title: 'Inventory Usage Report',
        description: 'Consumption, low-stock pressure, and top-used inventory items.',
        chartKey: 'topConsumedItems',
        tableKeys: ['lowStockItems', 'topConsumedItems'],
      };
    case 'patient-followup':
      return {
        eyebrow: 'Patient Follow-up',
        title: 'Patient Follow-up Report',
        description: 'Follow-up buckets and the patients who are overdue or due soon.',
        chartKey: 'followupBuckets',
        tableKeys: ['overdue', 'dueSoon'],
      };
  }
}

function ReportContent({
  reportType,
  data,
  isLoading,
  error,
}: {
  reportType: ReportType;
  data: Record<string, unknown> | null;
  isLoading: boolean;
  error: string | null;
}) {
  const meta = getReportMeta(reportType);
  const summary = asRecord(data?.summary) ?? {};
  const charts = asRecord(data?.charts) ?? {};
  const tables = asRecord(data?.tables) ?? {};
  const filters = asRecord(data?.filters);
  const metricItems = Object.entries(summary).map(([key, value]) => ({
    label: formatMetricLabel(key),
    value: reportFieldValue(value),
  }));
  const doctorRows =
    reportType === 'doctor-performance' && Array.isArray(tables.doctors)
      ? (tables.doctors as Array<Record<string, unknown>>)
      : [];
  const primaryDoctorRow = doctorRows[0] ?? null;
  const isSingleDoctorReport = reportType === 'doctor-performance' && doctorRows.length <= 1;
  const chartCard = isSingleDoctorReport
    ? null
    : renderChartByKey(toTitleCase(meta.chartKey), meta.chartKey, charts[meta.chartKey]);
  const tableCards = meta.tableKeys
    .map((tableKey) => {
      const tableValue = tables[tableKey];
      if (!Array.isArray(tableValue)) return null;
      return <TableCard key={tableKey} title={toTitleCase(tableKey)} rows={tableValue} />;
    })
    .filter(Boolean);

  return (
    <AnalyticsSectionBlock
      eyebrow={meta.eyebrow}
      title={meta.title}
      description={meta.description}
    >
      {isLoading ? (
        <AsyncStatePanel
          eyebrow="Loading"
          title="Loading report"
          description="The selected report is being prepared."
          tone="loading"
        />
      ) : error ? (
        <AsyncStatePanel
          eyebrow="Error"
          title="Report could not be loaded"
          description={error}
          tone="error"
        />
      ) : (
        <div className="space-y-3">
          {filters ? (
            <div className="flex flex-wrap gap-2">
              {filters.role ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[0.72rem] font-semibold text-slate-700">
                  Role: {reportFieldValue(filters.role)}
                </span>
              ) : null}
              {typeof filters.visitMode === 'string' && filters.visitMode ? (
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-[0.72rem] font-semibold text-sky-800">
                  Visit Mode: {formatVisitMode(filters.visitMode)}
                </span>
              ) : null}
              {typeof filters.doctorWorkflowMode === 'string' && filters.doctorWorkflowMode ? (
                <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[0.72rem] font-semibold text-violet-800">
                  Workflow Mode: {formatWorkflowMode(filters.doctorWorkflowMode)}
                </span>
              ) : null}
            </div>
          ) : null}
          {isSingleDoctorReport ? (
            <div className="space-y-3">
              <div className="grid gap-3 xl:grid-cols-2">
                {metricItems.length ? (
                  <MetricStrip title="Report Summary" metrics={metricItems} />
                ) : null}
                {tableCards[0] ?? null}
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <AnalyticsCard eyebrow="Report Context" title="Applied Scope">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-[18px] border border-white/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.9))] px-3 py-2 ring-1 ring-slate-100">
                      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Role
                      </p>
                      <p className="mt-2 text-[0.95rem] font-bold text-slate-950">
                        {filters?.role ? reportFieldValue(filters.role) : 'Doctor'}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-white/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.9))] px-3 py-2 ring-1 ring-slate-100">
                      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Visit Mode
                      </p>
                      <p className="mt-2 text-[0.95rem] font-bold text-slate-950">
                        {typeof filters?.visitMode === 'string' && filters.visitMode
                          ? formatVisitMode(filters.visitMode)
                          : 'All'}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-white/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.9))] px-3 py-2 ring-1 ring-slate-100">
                      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Workflow Mode
                      </p>
                      <p className="mt-2 text-[0.95rem] font-bold text-slate-950">
                        {typeof filters?.doctorWorkflowMode === 'string' && filters.doctorWorkflowMode
                          ? formatWorkflowMode(filters.doctorWorkflowMode)
                          : 'All'}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-white/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.9))] px-3 py-2 ring-1 ring-slate-100">
                      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Doctor
                      </p>
                      <p className="mt-2 text-[0.95rem] font-bold text-slate-950">
                        {primaryDoctorRow ? reportFieldValue(primaryDoctorRow.doctorName ?? primaryDoctorRow.name) : '--'}
                      </p>
                    </div>
                  </div>
                </AnalyticsCard>

                <AnalyticsCard eyebrow="Doctor Insight" title="Activity Snapshot">
                  <div className="space-y-3 text-sm leading-6 text-slate-600">
                    <div className="rounded-[18px] border border-sky-100 bg-sky-50/75 px-4 py-3">
                      <p className="font-medium text-sky-900">
                        {primaryDoctorRow
                          ? `${reportFieldValue(primaryDoctorRow.doctorName ?? primaryDoctorRow.name)} handled ${reportFieldValue(primaryDoctorRow.encounters)} encounters in this report range.`
                          : 'This report is scoped to the logged-in doctor for the selected range.'}
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-[16px] bg-slate-50/80 px-3 py-2 ring-1 ring-slate-100">
                        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Average Minutes
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {primaryDoctorRow ? reportFieldValue(primaryDoctorRow.averageMinutes) : '--'}
                        </p>
                      </div>
                      <div className="rounded-[16px] bg-slate-50/80 px-3 py-2 ring-1 ring-slate-100">
                        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Encounter Scope
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {typeof filters?.visitMode === 'string' && filters.visitMode
                            ? `${formatVisitMode(filters.visitMode)} only`
                            : 'All visits'}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnalyticsCard>
              </div>
            </div>
          ) : metricItems.length ? (
            <MetricStrip title="Report Summary" metrics={metricItems} />
          ) : null}
          <div className={getChartGridClass((chartCard ? 1 : 0) + tableCards.length)}>
            {chartCard}
            {isSingleDoctorReport ? tableCards.slice(1) : tableCards}
          </div>
          {!metricItems.length && !chartCard && !tableCards.length ? (
            <EmptyTabState message="No report data is available for the selected range yet." />
          ) : null}
        </div>
      )}
    </AnalyticsSectionBlock>
  );
}

function DailySummaryContent({
  data,
  history,
  activeTab,
  onTabChange,
  isLoading,
  error,
}: {
  data: Record<string, unknown> | null;
  history: unknown;
  activeTab: DailySummaryTab;
  onTabChange: (tab: DailySummaryTab) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const summary = asRecord(data?.summary) ?? {};
  const filterContext = asRecord(data?.filterContext);
  const metricItems = flattenSummaryMetrics(summary, 7);
  const insightItems = [
    ...toInsightRows(data?.insights),
    ...toInsightRows(data?.alerts),
  ].slice(0, 4);
  const primaryMetrics = metricItems.slice(0, 7);
  const supportMetrics = metricItems.slice(0, 4);
  const historyRows = Array.isArray(history)
    ? history
    : Array.isArray(asRecord(history)?.history)
      ? ((asRecord(history)?.history as unknown[]) ?? [])
      : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-slate-200/80 bg-white/92 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ring-1 ring-sky-50/70">
        <div className="min-w-[120px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Dashboard
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            Daily summary
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onTabChange('summary')}
            className={
              activeTab === 'summary'
                ? 'rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white'
                : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700'
            }
          >
            Daily Summary
          </button>
          <button
            type="button"
            onClick={() => onTabChange('history')}
            className={
              activeTab === 'history'
                ? 'rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white'
                : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700'
            }
          >
            History
          </button>
        </div>
      </div>

      {isLoading ? (
        <AsyncStatePanel
          eyebrow="Loading"
          title="Loading daily summary"
          description="Today’s action-driven clinic summary is being prepared."
          tone="loading"
        />
      ) : error ? (
        <AsyncStatePanel
          eyebrow="Error"
          title="Daily summary could not be loaded"
          description={error}
          tone="error"
        />
      ) : activeTab === 'summary' ? (
        <div className="space-y-3">
          {filterContext ? (
            <div className="flex flex-wrap gap-2">
              {filterContext.role ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[0.72rem] font-semibold text-slate-700">
                  Role: {reportFieldValue(filterContext.role)}
                </span>
              ) : null}
              {typeof filterContext.visitMode === 'string' && filterContext.visitMode ? (
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-[0.72rem] font-semibold text-sky-800">
                  Visit Mode: {formatVisitMode(filterContext.visitMode)}
                </span>
              ) : null}
              {typeof filterContext.doctorWorkflowMode === 'string' && filterContext.doctorWorkflowMode ? (
                <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[0.72rem] font-semibold text-violet-800">
                  Workflow Mode: {formatWorkflowMode(filterContext.doctorWorkflowMode)}
                </span>
              ) : null}
            </div>
          ) : null}

          {primaryMetrics.length ? (
            <MetricStrip title="What Is Happening Today" metrics={primaryMetrics} />
          ) : null}

          <div className="grid gap-3 xl:grid-cols-2">
            <InsightsCard title="What Needs Attention" items={insightItems} />
            <AnalyticsCard eyebrow="Action Focus" title="What Looks Unusual">
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <p>
                  This landing view is built for quick decisions: what is happening today, what looks unusual, and what needs attention next.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {supportMetrics.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[16px] bg-slate-50/80 px-3 py-2 ring-1 ring-slate-100"
                    >
                      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {reportFieldValue(item.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </AnalyticsCard>
          </div>

          {!primaryMetrics.length && !insightItems.length ? (
            <EmptyTabState message="No daily summary data is available for the selected date yet." />
          ) : null}
        </div>
      ) : (
        <AnalyticsSectionBlock
          eyebrow="Daily Summary History"
          title="Recent Summary Snapshots"
          description="Review recent summary snapshots without opening the full analytics reports each time."
        >
          {historyRows.length ? (
            <TableCard title="Summary History" rows={historyRows} />
          ) : (
            <EmptyTabState message="No daily summary history is available yet." />
          )}
        </AnalyticsSectionBlock>
      )}
    </div>
  );
}

function RoleAnalyticsPanels({ data }: { data: AnalyticsDashboardResponse }) {
  const tabs = useMemo(() => getRoleTabs(data), [data]);
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.key ?? 'overview');

  const summaryMap = useMemo(() => new Map(Object.entries(data.summary ?? {})), [data.summary]);
  const chartRecord = data.charts ?? {};
  const tableMap = useMemo(() => new Map(Object.entries(data.tables ?? {})), [data.tables]);
  const currentTab = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

  useEffect(() => {
    setActiveTab(tabs[0]?.key ?? 'overview');
  }, [tabs]);

  if (!currentTab) {
    return null;
  }

  const chartCards = (currentTab.chartKeys ?? [])
    .map((chartKey) => renderChartByKey(toTitleCase(chartKey), chartKey, chartRecord[chartKey]))
    .filter(Boolean);

  const tableCards = (currentTab.tableKeys ?? []).flatMap((tableKey) => {
    const tableValue = tableMap.get(tableKey);

    if (Array.isArray(tableValue)) {
      return [<TableCard key={tableKey} title={toTitleCase(tableKey)} rows={tableValue} />];
    }

    const nested = asRecord(tableValue);
    if (!nested) return [];

    return Object.entries(nested).map(([nestedKey, nestedValue]) => (
      <TableCard key={`${tableKey}-${nestedKey}`} title={toTitleCase(nestedKey)} rows={nestedValue} />
    ));
  });

  const hasSummary = (currentTab.summaryKeys ?? []).some((sectionKey) => summaryMap.has(sectionKey));
  const hasInsights = Boolean(currentTab.showInsights && data.insights.length);
  const hasAlerts = Boolean(currentTab.showAlerts && data.alerts.length);
  const hasContent = hasSummary || hasInsights || hasAlerts || chartCards.length > 0 || tableCards.length > 0;
  const doctorKpis = isDoctorAnalytics(data) ? getDoctorKpiMetrics(data) : [];
  const doctorInsights = isDoctorAnalytics(data) ? buildDoctorInsights(data) : [];
  const mergedInsights = isDoctorAnalytics(data)
    ? [...doctorInsights, ...data.insights]
    : data.insights;
  const insightCards = [];
  if (mergedInsights.length) {
    insightCards.push(<InsightsCard key="insights" title="Insights" items={mergedInsights} />);
  }
  if (data.alerts.length) {
    insightCards.push(<InsightsCard key="alerts" title="Alerts" items={data.alerts} />);
  }
  const hasSideColumn = hasSummary || insightCards.length > 0;
  const isDoctorOverview = isDoctorAnalytics(data) && currentTab.key === 'overview';
  const isDoctorDiagnosis = isDoctorAnalytics(data) && currentTab.key === 'diagnoses';
  const isDoctorPrescriptions = isDoctorAnalytics(data) && currentTab.key === 'prescriptions';
  const isDoctorRecords = isDoctorAnalytics(data) && currentTab.key === 'records';

  return (
    <div className="space-y-3">
      {insightCards.length ? (
        <div className={getChartGridClass(insightCards.length)}>
          {insightCards}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-slate-200/80 bg-white/92 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ring-1 ring-sky-50/70">
        <div className="min-w-[120px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Report Views
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            Select a dashboard section
          </p>
        </div>
        <ViewportTabs
          className="pb-0"
          tabs={tabs.map((tab) => ({
            key: tab.key,
            label: tab.label,
            active: tab.key === activeTab,
            onClick: () => setActiveTab(tab.key),
          }))}
        />
      </div>

      <AnalyticsSectionBlock
        eyebrow={currentTab.eyebrow}
        title={currentTab.title}
        description={currentTab.description}
      >
        {isDoctorRecords ? <DoctorPatientShortcut /> : null}

        {hasContent ? (
          isDoctorOverview ? (
            <div className="space-y-3">
              <div className="grid auto-rows-fr items-stretch gap-3 xl:grid-cols-3">
                {(currentTab.summaryKeys ?? []).map((sectionKey) => {
                  const sectionValue = summaryMap.get(sectionKey);
                  return sectionValue ? (
                    <MetricStrip
                      key={sectionKey}
                      title={toTitleCase(sectionKey)}
                      metrics={getMetricItems(sectionValue)}
                    />
                  ) : null;
                })}
              </div>

              <div className="grid auto-rows-fr items-stretch gap-3 xl:grid-cols-4">
                {chartCards}
              </div>
            </div>
          ) : isDoctorDiagnosis ? (
            <div className="grid auto-rows-fr items-stretch gap-3 xl:grid-cols-3">
              {(currentTab.summaryKeys ?? []).map((sectionKey) => {
                const sectionValue = summaryMap.get(sectionKey);
                return sectionValue ? (
                  <MetricStrip
                    key={sectionKey}
                    title={toTitleCase(sectionKey)}
                    metrics={getMetricItems(sectionValue)}
                  />
                ) : null;
              })}

              <div className="grid auto-rows-fr items-stretch gap-3 xl:col-span-2 xl:grid-cols-2">
                {chartCards}
                {tableCards}
              </div>
            </div>
          ) : isDoctorPrescriptions ? (
            <div className="grid auto-rows-fr items-stretch gap-3 xl:grid-cols-4">
              {(currentTab.summaryKeys ?? []).map((sectionKey) => {
                const sectionValue = summaryMap.get(sectionKey);
                return sectionValue ? (
                  <MetricStrip
                    key={sectionKey}
                    title={toTitleCase(sectionKey)}
                    metrics={getMetricItems(sectionValue)}
                  />
                ) : null;
              })}
              {chartCards}
            </div>
          ) : isDoctorRecords ? (
            <div className="space-y-3">
              <div className={getChartGridClass(tableCards.length)}>
                {tableCards}
              </div>
            </div>
          ) : (
          <div className={getTabContentLayoutClass(hasSideColumn, chartCards.length, tableCards.length)}>
            {hasSideColumn ? (
              <div className="space-y-3">
                {(currentTab.summaryKeys ?? []).map((sectionKey) => {
                  const sectionValue = summaryMap.get(sectionKey);
                  return sectionValue ? (
                    <MetricStrip
                      key={sectionKey}
                      title={toTitleCase(sectionKey)}
                      metrics={getMetricItems(sectionValue)}
                    />
                  ) : null;
                })}
              </div>
            ) : null}

            <div className={getChartGridClass(chartCards.length + tableCards.length)}>
              {chartCards}
              {tableCards}
            </div>
          </div>
          )
        ) : (
          <EmptyTabState message="No analytics data is available for this tab in the selected range yet." />
        )}
      </AnalyticsSectionBlock>
    </div>
  );
}

export default function AnalyticsSection() {
  const {
    currentUser,
    data,
    loadState,
    range,
    setRange,
    customDateFrom,
    setCustomDateFrom,
    customDateTo,
    setCustomDateTo,
    ownerView,
    setOwnerView,
    selectedDoctorId,
    setSelectedDoctorId,
    selectedAssistantId,
    setSelectedAssistantId,
    doctorOptions,
    assistantOptions,
    reload,
    isRefreshing,
  } = useAnalyticsDashboard();
  const [workspaceMode, setWorkspaceMode] = useState<AnalyticsWorkspaceMode>('dashboard');
  const [dailySummaryTab, setDailySummaryTab] = useState<DailySummaryTab>('summary');
  const [summaryDate, setSummaryDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportVisitMode, setReportVisitMode] = useState('');
  const [reportWorkflowMode, setReportWorkflowMode] = useState('');

  const resolvedRole = data?.roleContext.resolvedRole ?? currentUser?.role ?? null;
  const isOwner = currentUser?.role === 'owner';
  const reportOptions = useMemo(() => getReportOptionsForRole(resolvedRole), [resolvedRole]);
  const [activeReportType, setActiveReportType] = useState<ReportType>(
    reportOptions[0]?.key ?? 'clinic-overview'
  );

  useEffect(() => {
    if (!reportOptions.some((option) => option.key === activeReportType)) {
      setActiveReportType(reportOptions[0]?.key ?? 'clinic-overview');
    }
  }, [activeReportType, reportOptions]);

  const generatedLabel = data ? getGeneratedLabel(data.generatedAt) : '--';
  const dailySummaryQueryInput = useMemo(() => {
    const next: {
      date?: string;
      role?: 'doctor' | 'assistant' | 'owner';
      doctorId?: number;
      assistantId?: number;
      visitMode?: 'walk_in' | 'appointment';
      doctorWorkflowMode?: 'self_service' | 'clinic_supported';
    } = {
      date: summaryDate,
      role: isOwner
        ? ownerView === 'organization'
          ? 'owner'
          : ownerView
        : ((resolvedRole as 'doctor' | 'assistant' | 'owner' | null) ?? undefined),
    };

    if (isOwner && ownerView === 'doctor' && selectedDoctorId.trim()) {
      next.doctorId = Number(selectedDoctorId);
    }
    if (isOwner && ownerView === 'assistant' && selectedAssistantId.trim()) {
      next.assistantId = Number(selectedAssistantId);
    }
    if (reportVisitMode === 'walk_in' || reportVisitMode === 'appointment') {
      next.visitMode = reportVisitMode;
    }
    if (reportWorkflowMode === 'self_service' || reportWorkflowMode === 'clinic_supported') {
      next.doctorWorkflowMode = reportWorkflowMode;
    }

    return next;
  }, [
    isOwner,
    ownerView,
    reportVisitMode,
    reportWorkflowMode,
    resolvedRole,
    selectedAssistantId,
    selectedDoctorId,
    summaryDate,
  ]);
  const reportsQueryInput = useMemo(() => {
    const next: {
      range?: '7d' | '30d' | 'custom';
      dateFrom?: string;
      dateTo?: string;
      doctorId?: number;
      assistantId?: number;
      visitMode?: 'walk_in' | 'appointment';
      doctorWorkflowMode?: 'self_service' | 'clinic_supported';
    } = { range: range === '1d' ? 'custom' : range };

    if (range === 'custom' || range === '1d') {
      next.dateFrom = customDateFrom;
      next.dateTo = customDateTo;
    }

    if (isOwner) {
      if (
        (activeReportType === 'doctor-performance' || activeReportType === 'patient-followup') &&
        selectedDoctorId.trim()
      ) {
        next.doctorId = Number(selectedDoctorId);
      }
      if (activeReportType === 'assistant-performance' && selectedAssistantId.trim()) {
        next.assistantId = Number(selectedAssistantId);
      }
    }

    if (reportVisitMode === 'walk_in' || reportVisitMode === 'appointment') {
      next.visitMode = reportVisitMode;
    }
    if (reportWorkflowMode === 'self_service' || reportWorkflowMode === 'clinic_supported') {
      next.doctorWorkflowMode = reportWorkflowMode;
    }

    return next;
  }, [
    activeReportType,
    customDateFrom,
    customDateTo,
    isOwner,
    range,
    reportVisitMode,
    reportWorkflowMode,
    selectedAssistantId,
    selectedDoctorId,
  ]);
  const reportQuery = useReportsQuery(activeReportType, reportsQueryInput, workspaceMode === 'reports');
  const dailySummaryQuery = useDailySummaryQuery(dailySummaryQueryInput, workspaceMode === 'dashboard');
  const dailySummaryHistoryQuery = useDailySummaryHistoryQuery(
    { ...dailySummaryQueryInput, limit: 7 },
    workspaceMode === 'dashboard' && dailySummaryTab === 'history'
  );
  const reportData = useMemo(
    () =>
      reportQuery.data && typeof reportQuery.data === 'object'
        ? (reportQuery.data as Record<string, unknown>)
        : null,
    [reportQuery.data]
  );
  const dailySummaryData = useMemo(
    () =>
      dailySummaryQuery.data && typeof dailySummaryQuery.data === 'object'
        ? (dailySummaryQuery.data as Record<string, unknown>)
        : null,
    [dailySummaryQuery.data]
  );
  const compactSelectSx = {
    border: 0,
    boxShadow: 'none',
    backgroundColor: 'transparent',
    '& .MuiOutlinedInput-notchedOutline': { border: 0 },
    '& .MuiSelect-select': {
      fontSize: '0.74rem',
      fontWeight: 600,
      px: '0 !important',
      minHeight: 'unset',
    },
  };
  const heroControls = (
    <>
      <ScopeField label="Range">
        <AppSelectField
          value={range}
          onValueChange={(value) => setRange(value as typeof range)}
          ariaLabel="Analytics range"
          options={[
            { value: '1d', label: '1 Day' },
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: 'custom', label: 'Custom' },
          ]}
          sx={compactSelectSx}
        />
      </ScopeField>

      {isOwner ? (
        <ScopeField label="Role">
          <AppSelectField
            value={ownerView}
            onValueChange={(value) =>
              setOwnerView(value as 'organization' | 'doctor' | 'assistant')
            }
            ariaLabel="Analytics role"
            options={[
              { value: 'organization', label: 'Organization' },
              { value: 'doctor', label: 'Doctor Drill-down' },
              { value: 'assistant', label: 'Assistant Drill-down' },
            ]}
            sx={compactSelectSx}
          />
        </ScopeField>
      ) : (
        <ScopeField label="Role">{resolvedRole ?? '--'}</ScopeField>
      )}

      <ScopeField label="Generated">{generatedLabel}</ScopeField>

      {isOwner && ownerView !== 'organization'
        ? ownerView === 'doctor'
          ? (
            <ScopeField label="Doctor">
              <AppSelectField
                value={selectedDoctorId}
                onValueChange={setSelectedDoctorId}
                ariaLabel="Doctor drill-down"
                options={[
                  { value: '', label: 'Select doctor' },
                  ...doctorOptions.map((doctor) => ({
                    value: String(doctor.id),
                    label: doctor.name,
                  })),
                ]}
                sx={compactSelectSx}
              />
            </ScopeField>
          )
          : (
            <ScopeField label="Assistant">
              <AppSelectField
                value={selectedAssistantId}
                onValueChange={setSelectedAssistantId}
                ariaLabel="Assistant drill-down"
                options={[
                  { value: '', label: 'Select assistant' },
                  ...assistantOptions.map((assistant) => ({
                    value: String(assistant.id),
                    label: assistant.name,
                  })),
                ]}
                sx={compactSelectSx}
              />
            </ScopeField>
          )
        : null}
    </>
  );

  return (
    <ViewportPage className="h-full overflow-hidden">
      <ViewportFrame>
        <ViewportBody className="flex min-h-0 flex-col gap-3 overflow-hidden px-4 py-3 sm:px-5 sm:py-4 lg:px-6">
          <ViewportHeader
            eyebrow="Insights Control Room"
            title="Daily Summary & Reports"
            description={
              workspaceMode === 'dashboard'
                ? 'See what is happening today, what looks unusual, and what needs attention first.'
                : 'Use deeper reports for clinic performance, doctor load, assistant operations, follow-up, and inventory usage.'
            }
            actions={
              <div className="flex items-center gap-2">
                <Link
                  href="/analytics"
                  className="rounded-2xl border border-sky-200 bg-white px-4 py-2 text-xs font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
                >
                  Back to Analytics
                </Link>
                <button
                  type="button"
                  onClick={() => void reload()}
                  className="ios-button-primary rounded-2xl px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isRefreshing}
                >
                  {isRefreshing
                    ? 'Refreshing...'
                    : workspaceMode === 'dashboard'
                      ? 'Refresh summary'
                      : 'Refresh reports'}
                </button>
              </div>
            }
          />

          <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-slate-200/80 bg-white/92 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ring-1 ring-sky-50/70">
            <div className="min-w-[120px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    View Mode
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Switch between daily summary and deep reports
                  </p>
                </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setWorkspaceMode('dashboard')}
                className={
                  workspaceMode === 'dashboard'
                    ? 'rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white'
                    : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700'
                }
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode('reports')}
                className={
                  workspaceMode === 'reports'
                    ? 'rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white'
                    : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700'
                }
              >
                Reports
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
          {workspaceMode === 'dashboard' ? (
            <div className="h-full space-y-3 overflow-y-scroll pr-1 pb-1">
              <div className="grid gap-3 rounded-[20px] border border-slate-200/80 bg-white/92 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ring-1 ring-sky-50/70 md:grid-cols-2 xl:grid-cols-5">
                <ScopeField label="Date">
                  <input
                    type="date"
                    value={summaryDate}
                    onChange={(event) => setSummaryDate(event.target.value)}
                    className="w-full bg-transparent text-[0.74rem] font-semibold text-slate-800 outline-none"
                  />
                </ScopeField>
                <ScopeField label="Visit Mode">
                  <AppSelectField
                    value={reportVisitMode}
                    onValueChange={setReportVisitMode}
                    ariaLabel="Daily summary visit mode"
                    options={[
                      { value: '', label: 'All' },
                      { value: 'walk_in', label: 'Walk-in' },
                      { value: 'appointment', label: 'Appointment' },
                    ]}
                    sx={compactSelectSx}
                  />
                </ScopeField>
                <ScopeField label="Workflow Mode">
                  <AppSelectField
                    value={reportWorkflowMode}
                    onValueChange={setReportWorkflowMode}
                    ariaLabel="Daily summary workflow mode"
                    options={[
                      { value: '', label: 'All' },
                      { value: 'self_service', label: 'Self Service' },
                      { value: 'clinic_supported', label: 'Clinic Supported' },
                    ]}
                    sx={compactSelectSx}
                  />
                </ScopeField>
                {isOwner ? (
                  ownerView === 'assistant' ? (
                    <ScopeField label="Assistant">
                      <AppSelectField
                        value={selectedAssistantId}
                        onValueChange={setSelectedAssistantId}
                        ariaLabel="Daily summary assistant filter"
                        options={[
                          { value: '', label: 'All assistants' },
                          ...assistantOptions.map((assistant) => ({
                            value: String(assistant.id),
                            label: assistant.name,
                          })),
                        ]}
                        sx={compactSelectSx}
                      />
                    </ScopeField>
                  ) : (
                    <ScopeField label="Doctor">
                      <AppSelectField
                        value={selectedDoctorId}
                        onValueChange={setSelectedDoctorId}
                        ariaLabel="Daily summary doctor filter"
                        options={[
                          { value: '', label: 'All doctors' },
                          ...doctorOptions.map((doctor) => ({
                            value: String(doctor.id),
                            label: doctor.name,
                          })),
                        ]}
                        sx={compactSelectSx}
                      />
                    </ScopeField>
                  )
                ) : (
                  <ScopeField label="Role">{resolvedRole ?? '--'}</ScopeField>
                )}
                <ScopeField label="Generated">
                  {dailySummaryData && typeof dailySummaryData.generatedAt === 'string'
                    ? getGeneratedLabel(dailySummaryData.generatedAt)
                    : generatedLabel}
                </ScopeField>
              </div>

              <DailySummaryContent
                data={dailySummaryData}
                history={dailySummaryHistoryQuery.data}
                activeTab={dailySummaryTab}
                onTabChange={setDailySummaryTab}
                isLoading={dailySummaryQuery.isPending || dailySummaryQuery.isFetching || (dailySummaryTab === 'history' && (dailySummaryHistoryQuery.isPending || dailySummaryHistoryQuery.isFetching))}
                error={
                  dailySummaryQuery.isError
                    ? (dailySummaryQuery.error as { message?: string } | undefined)?.message ?? 'Unable to load daily summary.'
                    : dailySummaryTab === 'history' && dailySummaryHistoryQuery.isError
                      ? (dailySummaryHistoryQuery.error as { message?: string } | undefined)?.message ?? 'Unable to load daily summary history.'
                      : null
                }
              />
            </div>
          ) : (
            <div className="h-full space-y-3 overflow-y-scroll pr-1 pb-1">
              {data && isDoctorAnalytics(data) ? (
                <div className="grid auto-rows-fr items-stretch gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
                  <MetricStrip title="Doctor Focus" metrics={getDoctorKpiMetrics(data)} />
                  <DashboardHero
                    resolvedRole={resolvedRole}
                    controls={heroControls}
                    title="Reports Scope"
                    description="Use report filters to review performance, follow-up, and mode-based clinic trends in more detail."
                  />
                </div>
              ) : (
                <DashboardHero
                  resolvedRole={resolvedRole}
                  controls={heroControls}
                  title="Reports Scope"
                  description="Use report filters to review performance, follow-up, and mode-based clinic trends in more detail."
                />
              )}
              <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-slate-200/80 bg-white/92 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ring-1 ring-sky-50/70">
                <div className="min-w-[120px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Reports
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Select a report view
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reportOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setActiveReportType(option.key)}
                      className={
                        option.key === activeReportType
                          ? 'rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white'
                          : 'rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-800'
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 rounded-[20px] border border-slate-200/80 bg-white/92 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ring-1 ring-sky-50/70 md:grid-cols-2 xl:grid-cols-5">
                <ScopeField label="Range">
                  <AppSelectField
                    value={range}
                    onValueChange={(value) => setRange(value as typeof range)}
                    ariaLabel="Reports range"
                    options={[
                      { value: '1d', label: '1 Day' },
                      { value: '7d', label: '7 Days' },
                      { value: '30d', label: '30 Days' },
                      { value: 'custom', label: 'Custom' },
                    ]}
                    sx={compactSelectSx}
                  />
                </ScopeField>
                <ScopeField label="Visit Mode">
                  <AppSelectField
                    value={reportVisitMode}
                    onValueChange={setReportVisitMode}
                    ariaLabel="Report visit mode"
                    options={[
                      { value: '', label: 'All' },
                      { value: 'walk_in', label: 'Walk-in' },
                      { value: 'appointment', label: 'Appointment' },
                    ]}
                    sx={compactSelectSx}
                  />
                </ScopeField>
                <ScopeField label="Workflow Mode">
                  <AppSelectField
                    value={reportWorkflowMode}
                    onValueChange={setReportWorkflowMode}
                    ariaLabel="Report workflow mode"
                    options={[
                      { value: '', label: 'All' },
                      { value: 'self_service', label: 'Self Service' },
                      { value: 'clinic_supported', label: 'Clinic Supported' },
                    ]}
                    sx={compactSelectSx}
                  />
                </ScopeField>
                {isOwner ? (
                  activeReportType === 'assistant-performance' ? (
                    <ScopeField label="Assistant">
                      <AppSelectField
                        value={selectedAssistantId}
                        onValueChange={setSelectedAssistantId}
                        ariaLabel="Report assistant filter"
                        options={[
                          { value: '', label: 'All assistants' },
                          ...assistantOptions.map((assistant) => ({
                            value: String(assistant.id),
                            label: assistant.name,
                          })),
                        ]}
                        sx={compactSelectSx}
                      />
                    </ScopeField>
                  ) : (
                    <ScopeField label="Doctor">
                      <AppSelectField
                        value={selectedDoctorId}
                        onValueChange={setSelectedDoctorId}
                        ariaLabel="Report doctor filter"
                        options={[
                          { value: '', label: 'All doctors' },
                          ...doctorOptions.map((doctor) => ({
                            value: String(doctor.id),
                            label: doctor.name,
                          })),
                        ]}
                        sx={compactSelectSx}
                      />
                    </ScopeField>
                  )
                ) : (
                  <ScopeField label="Role">{resolvedRole ?? '--'}</ScopeField>
                )}
                <ScopeField label="Generated">
                  {reportData && typeof reportData.generatedAt === 'string'
                    ? getGeneratedLabel(reportData.generatedAt)
                    : generatedLabel}
                </ScopeField>
              </div>

              <ReportContent
                reportType={activeReportType}
                data={reportData}
                isLoading={reportQuery.isPending || reportQuery.isFetching}
                error={reportQuery.isError ? (reportQuery.error as { message?: string } | undefined)?.message ?? 'Unable to load report data.' : null}
              />
            </div>
          )}
          </div>
        </ViewportBody>
      </ViewportFrame>
    </ViewportPage>
  );
}
