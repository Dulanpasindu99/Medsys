'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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

function getRangeLabel(
  preset: string | undefined,
  dateFrom: string | undefined,
  dateTo: string | undefined
) {
  if (preset === 'custom' && dateFrom && dateTo) {
    return `${dateFrom} - ${dateTo}`;
  }

  switch (preset) {
    case '1d':
      return 'Last 1 day';
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    default:
      return 'Selected range';
  }
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
  generatedAt,
  rangeLabel,
  controls,
}: {
  resolvedRole: string | null;
  generatedAt: string;
  rangeLabel: string;
  controls: React.ReactNode;
}) {
  return (
    <AnalyticsCard
      eyebrow="Dashboard Scope"
      title={resolvedRole ? `${toTitleCase(resolvedRole)} Dashboard` : 'Realtime Dashboard'}
      className="border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,255,0.94))]"
    >
      <div className="grid items-center gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)]">
        <div className="space-y-1.5">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Dashboard View
          </p>
          <p className="max-w-2xl text-[0.74rem] leading-5 text-slate-600">
            {resolvedRole === 'doctor'
              ? 'Clinical analytics for demographics, diagnoses, prescriptions, tests, and patient recall.'
              : 'Role-based analytics grouped into a cleaner and more focused workspace.'}
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

      <AnalyticsCard eyebrow="Workspace" title="Analytics Views">
        <ViewportTabs
          tabs={tabs.map((tab) => ({
            key: tab.key,
            label: tab.label,
            active: tab.key === activeTab,
            onClick: () => setActiveTab(tab.key),
          }))}
        />
      </AnalyticsCard>

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

  const resolvedRole = data?.roleContext.resolvedRole ?? currentUser?.role ?? null;
  const isOwner = currentUser?.role === 'owner';
  const rangeLabel = getRangeLabel(
    data?.range.preset ?? range,
    data?.range.dateFrom,
    data?.range.dateTo
  );
  const generatedLabel = data ? getGeneratedLabel(data.generatedAt) : '--';
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
        <ViewportBody className="gap-3 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4 lg:px-6">
          <ViewportHeader
            eyebrow="Insights Control Room"
            title="Realtime Analytics"
            description={
              resolvedRole
                ? `Live ${resolvedRole} dashboard powered by the analytics dashboard endpoint.`
                : 'Live dashboard powered by the analytics dashboard endpoint.'
            }
            actions={
              <button
                type="button"
                onClick={() => void reload()}
                className="ios-button-primary rounded-2xl px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh metrics'}
              </button>
            }
          />

          {data && isDoctorAnalytics(data) ? (
            <div className="grid auto-rows-fr items-stretch gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
              <MetricStrip title="Doctor Focus" metrics={getDoctorKpiMetrics(data)} />
              <DashboardHero
                resolvedRole={resolvedRole}
                generatedAt={generatedLabel}
                rangeLabel={rangeLabel}
                controls={heroControls}
              />
            </div>
          ) : (
            <DashboardHero
              resolvedRole={resolvedRole}
              generatedAt={generatedLabel}
              rangeLabel={rangeLabel}
              controls={heroControls}
            />
          )}

          {loadState.status === 'loading' ? (
            <AsyncStatePanel
              eyebrow="Loading"
              title="Loading analytics workspace"
              description="Role-based analytics are being aggregated from the dashboard endpoint."
              tone="loading"
            />
          ) : loadState.status === 'error' ? (
            <AsyncStatePanel
              eyebrow="Error"
              title="Analytics workspace could not be loaded"
              description={loadState.error ?? 'Analytics data is unavailable right now.'}
              tone="error"
              actionLabel="Retry analytics"
              onAction={() => void reload()}
            />
          ) : loadState.status === 'empty' ? (
            <AsyncStatePanel
              eyebrow="Empty"
              title="No analytics data available"
              description={loadState.notice ?? 'No data for selected range.'}
              tone="empty"
            />
          ) : data ? (
            <div className="pb-1">
              <RoleAnalyticsPanels data={data} />
            </div>
          ) : null}
        </ViewportBody>
      </ViewportFrame>
    </ViewportPage>
  );
}
