'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useCurrentUserQuery } from '../lib/query-hooks';
import type { AppRole } from '../lib/roles';
import {
  ViewportBody,
  ViewportFrame,
  ViewportHeader,
  ViewportPage,
  ViewportScrollBody,
} from '../components/ui/ViewportLayout';

type RoleSlot = 'owner' | 'doctor' | 'assistant' | 'anonymous';
type EndpointCategory =
  | 'auth'
  | 'users'
  | 'patients'
  | 'appointments'
  | 'clinical'
  | 'analytics'
  | 'inventory'
  | 'tasks-audit';

type EndpointExpectation = Record<RoleSlot, string>;

type EndpointChecklistItem = {
  id: string;
  category: EndpointCategory;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  guard: string;
  purpose: string;
  expected: EndpointExpectation;
  primaryOwner: 'BE' | 'FE' | 'Shared';
  note?: string;
};

type RunnerState = 'idle' | 'running' | 'passed' | 'failed' | 'skipped';

type EndpointRunResult = {
  state: RunnerState;
  checkedAt?: string;
  durationMs?: number;
  expected?: string;
  actual?: number;
  path?: string;
  message?: string;
};

type ProbeContext = {
  patientId?: number;
  encounterId?: number;
  appointmentId?: number;
  inventoryId?: number;
  taskId?: number;
  diagnosisCode?: string;
};

const CATEGORY_OPTIONS: Array<{ value: 'all' | EndpointCategory; label: string }> = [
  { value: 'all', label: 'All Endpoints' },
  { value: 'auth', label: 'Auth' },
  { value: 'users', label: 'Users' },
  { value: 'patients', label: 'Patients' },
  { value: 'appointments', label: 'Appointments' },
  { value: 'clinical', label: 'Clinical' },
  { value: 'analytics', label: 'Analytics & Reports' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'tasks-audit', label: 'Tasks & Audit' },
];

const ROLE_LABELS: Record<RoleSlot, string> = {
  owner: 'Owner',
  doctor: 'Doctor',
  assistant: 'Assistant',
  anonymous: 'No Session',
};

const ENDPOINTS: EndpointChecklistItem[] = [
  {
    id: 'auth-login',
    category: 'auth',
    method: 'POST',
    path: '/api/auth/login',
    guard: 'Public (payload validation)',
    purpose: 'Sign in with organization slug/id + credentials.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '200' },
    primaryOwner: 'FE',
    note: 'Must send organizationSlug or organizationId.',
  },
  {
    id: 'auth-logout',
    category: 'auth',
    method: 'POST',
    path: '/api/auth/logout',
    guard: 'Public',
    purpose: 'Clear session and backend auth cookies.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '200' },
    primaryOwner: 'Shared',
  },
  {
    id: 'auth-me',
    category: 'auth',
    method: 'GET',
    path: '/api/auth/me',
    guard: 'Session required',
    purpose: 'Resolve current authenticated identity.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'FE',
  },
  {
    id: 'auth-active-role',
    category: 'auth',
    method: 'POST',
    path: '/api/auth/active-role',
    guard: 'Session required',
    purpose: 'Switch active role within assigned roles.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'FE',
  },
  {
    id: 'auth-status',
    category: 'auth',
    method: 'GET',
    path: '/api/auth/status',
    guard: 'Public',
    purpose: 'Bootstrap/tenant status probe for login flow.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '200' },
    primaryOwner: 'Shared',
  },
  {
    id: 'auth-register',
    category: 'auth',
    method: 'POST',
    path: '/api/auth/register',
    guard: 'user.write (except first-user bootstrap)',
    purpose: 'Create new account via registration flow.',
    expected: { owner: '200*', doctor: '403', assistant: '403', anonymous: '401*' },
    primaryOwner: 'BE',
    note: '*Bootstrap mode can allow first user creation.',
  },

  {
    id: 'users-list',
    category: 'users',
    method: 'GET',
    path: '/api/users',
    guard: 'user.read',
    purpose: 'List users for owner/staff management.',
    expected: { owner: '200', doctor: '403', assistant: '403', anonymous: '401' },
    primaryOwner: 'FE',
    note: 'Doctor/assistant pages should skip this call.',
  },
  {
    id: 'users-create',
    category: 'users',
    method: 'POST',
    path: '/api/users',
    guard: 'user.write',
    purpose: 'Create doctor/assistant accounts.',
    expected: { owner: '200', doctor: '403', assistant: '403', anonymous: '401' },
    primaryOwner: 'BE',
  },
  {
    id: 'users-update',
    category: 'users',
    method: 'PATCH',
    path: '/api/users/:id',
    guard: 'user.write',
    purpose: 'Update user permissions/overrides.',
    expected: { owner: '200', doctor: '403', assistant: '403', anonymous: '401' },
    primaryOwner: 'BE',
  },

  {
    id: 'patients-list',
    category: 'patients',
    method: 'GET',
    path: '/api/patients',
    guard: 'patient.read',
    purpose: 'Search/list patients.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'patients-create',
    category: 'patients',
    method: 'POST',
    path: '/api/patients',
    guard: 'patient.write',
    purpose: 'Create new patient.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'FE',
  },
  {
    id: 'patients-detail',
    category: 'patients',
    method: 'GET',
    path: '/api/patients/:id',
    guard: 'patient.read',
    purpose: 'Load patient details.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'patients-update',
    category: 'patients',
    method: 'PATCH',
    path: '/api/patients/:id',
    guard: 'patient.write',
    purpose: 'Update patient details.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'FE',
  },
  {
    id: 'patients-delete',
    category: 'patients',
    method: 'DELETE',
    path: '/api/patients/:id',
    guard: 'patient.delete',
    purpose: 'Delete patient record.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'BE',
  },
  {
    id: 'patients-profile',
    category: 'patients',
    method: 'GET',
    path: '/api/patients/:id/profile',
    guard: 'patient.read',
    purpose: 'Patient profile summary.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'patients-consultations',
    category: 'patients',
    method: 'GET',
    path: '/api/patients/:id/consultations',
    guard: 'patient.read',
    purpose: 'Consultation history feed.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'patients-family',
    category: 'patients',
    method: 'GET',
    path: '/api/patients/:id/family',
    guard: 'patient.read',
    purpose: 'Family linkage feed.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'patients-vitals',
    category: 'patients',
    method: 'GET',
    path: '/api/patients/:id/vitals',
    guard: 'patient.read',
    purpose: 'Patient-level vitals history.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'patients-vitals-create',
    category: 'patients',
    method: 'POST',
    path: '/api/backend/v1/patients/:id/vitals',
    guard: 'Backend validation',
    purpose: 'Direct vital insert through backend proxy.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'FE',
    note: 'Legacy direct proxy path; validates measurement ranges.',
  },
  {
    id: 'patients-allergies-list',
    category: 'patients',
    method: 'GET',
    path: '/api/patients/:id/allergies',
    guard: 'patient.read',
    purpose: 'Allergy list for patient.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'patients-allergies-create',
    category: 'patients',
    method: 'POST',
    path: '/api/backend/v1/patients/:id/allergies',
    guard: 'Backend validation',
    purpose: 'Create allergy entry via backend proxy.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'FE',
  },
  {
    id: 'patients-conditions',
    category: 'patients',
    method: 'GET',
    path: '/api/patients/:id/conditions',
    guard: 'patient.read',
    purpose: 'Condition history feed.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'patients-timeline',
    category: 'patients',
    method: 'GET',
    path: '/api/patients/:id/timeline',
    guard: 'patient.read',
    purpose: 'Timeline events feed.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'patients-history-list',
    category: 'patients',
    method: 'GET',
    path: '/api/patients/:id/history',
    guard: 'patient.history.read',
    purpose: 'Clinical history notes list.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'patients-history-create',
    category: 'patients',
    method: 'POST',
    path: '/api/patients/:id/history',
    guard: 'patient.history.write',
    purpose: 'Add clinical history notes.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'FE',
  },
  {
    id: 'families-list',
    category: 'patients',
    method: 'GET',
    path: '/api/families',
    guard: 'patient.read',
    purpose: 'List families for link selection.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },

  {
    id: 'appointments-list',
    category: 'appointments',
    method: 'GET',
    path: '/api/appointments',
    guard: 'Session required',
    purpose: 'List appointments/queue state.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'appointments-create',
    category: 'appointments',
    method: 'POST',
    path: '/api/appointments',
    guard: 'appointment.create',
    purpose: 'Create appointment.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'FE',
  },
  {
    id: 'appointments-doctors',
    category: 'appointments',
    method: 'GET',
    path: '/api/appointments/doctors',
    guard: 'appointment.create',
    purpose: 'Doctor dropdown source for scheduling.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'appointments-update',
    category: 'appointments',
    method: 'PATCH',
    path: '/api/appointments/:id',
    guard: 'appointment.update',
    purpose: 'Update appointment status.',
    expected: { owner: '200', doctor: '200', assistant: '403', anonymous: '401' },
    primaryOwner: 'BE',
  },
  {
    id: 'visits-start',
    category: 'appointments',
    method: 'POST',
    path: '/api/visits/start',
    guard: 'appointment.create OR appointment.update',
    purpose: 'Start visit for patient.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'encounters-list',
    category: 'appointments',
    method: 'GET',
    path: '/api/encounters',
    guard: 'Session required',
    purpose: 'List encounter records.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'encounters-create',
    category: 'appointments',
    method: 'POST',
    path: '/api/encounters',
    guard: 'Session required',
    purpose: 'Create encounter.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'encounters-detail',
    category: 'appointments',
    method: 'GET',
    path: '/api/encounters/:id',
    guard: 'Session required',
    purpose: 'Load encounter details (includes vital).',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'consultations-save',
    category: 'appointments',
    method: 'POST',
    path: '/api/consultations/save',
    guard: 'Session required + workflow validation',
    purpose: 'Save appointment/walk-in consultation snapshot.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
    note: 'Walk-in edits should send appointmentId when available.',
  },

  {
    id: 'clinical-diagnoses',
    category: 'clinical',
    method: 'GET',
    path: '/api/clinical/diagnoses',
    guard: 'clinical.icd10.read',
    purpose: 'Diagnosis search lookup.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'clinical-tests',
    category: 'clinical',
    method: 'GET',
    path: '/api/clinical/tests',
    guard: 'clinical.tests.read',
    purpose: 'Clinical tests lookup.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'clinical-recommended-tests',
    category: 'clinical',
    method: 'GET',
    path: '/api/clinical/diagnoses/:code/recommended-tests',
    guard: 'clinical.tests.read',
    purpose: 'Recommended tests for diagnosis.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'clinical-icd10',
    category: 'clinical',
    method: 'GET',
    path: '/api/clinical/icd10',
    guard: 'clinical.icd10.read',
    purpose: 'ICD-10 search lookup.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },

  {
    id: 'analytics-overview',
    category: 'analytics',
    method: 'GET',
    path: '/api/analytics/overview',
    guard: 'analytics.view',
    purpose: 'Legacy analytics overview.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'analytics-dashboard',
    category: 'analytics',
    method: 'GET',
    path: '/api/analytics/dashboard',
    guard: 'analytics.view',
    purpose: 'Role-aware dashboard payload.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'reports-main',
    category: 'analytics',
    method: 'GET',
    path: '/api/reports/:reportType',
    guard: 'Session required',
    purpose: 'Phase-1 reports endpoint family.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'FE',
    note: 'Use range=7d|30d|custom only (not days).',
  },
  {
    id: 'reports-daily-summary',
    category: 'analytics',
    method: 'GET',
    path: '/api/reports/daily-summary',
    guard: 'Session required',
    purpose: 'Daily summary snapshot payload.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'reports-daily-history',
    category: 'analytics',
    method: 'GET',
    path: '/api/reports/daily-summary/history',
    guard: 'Session required',
    purpose: 'Daily summary history list.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },

  {
    id: 'inventory-list',
    category: 'inventory',
    method: 'GET',
    path: '/api/inventory',
    guard: 'Session required',
    purpose: 'Inventory master list.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'inventory-create',
    category: 'inventory',
    method: 'POST',
    path: '/api/inventory',
    guard: 'inventory.write',
    purpose: 'Create inventory item.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'FE',
  },
  {
    id: 'inventory-detail',
    category: 'inventory',
    method: 'GET',
    path: '/api/inventory/:id',
    guard: 'Session required',
    purpose: 'Inventory detail + summaries.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'inventory-update',
    category: 'inventory',
    method: 'PATCH',
    path: '/api/inventory/:id',
    guard: 'inventory.write',
    purpose: 'Update inventory metadata.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'FE',
    note: 'Do not use for stock quantity updates.',
  },
  {
    id: 'inventory-alerts',
    category: 'inventory',
    method: 'GET',
    path: '/api/inventory/alerts?days=30',
    guard: 'Session required',
    purpose: 'Low stock and risk alerts.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'inventory-reports',
    category: 'inventory',
    method: 'GET',
    path: '/api/inventory/reports?days=30',
    guard: 'Session required',
    purpose: 'Inventory report aggregates.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'FE',
    note: 'Use days (not range).',
  },
  {
    id: 'inventory-search',
    category: 'inventory',
    method: 'GET',
    path: '/api/inventory/search?q=...',
    guard: 'Session required',
    purpose: 'Search inventory items.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'inventory-movements-list',
    category: 'inventory',
    method: 'GET',
    path: '/api/inventory/:id/movements',
    guard: 'Session required',
    purpose: 'Movement history.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'inventory-movements-create',
    category: 'inventory',
    method: 'POST',
    path: '/api/inventory/:id/movements',
    guard: 'inventory.write + conversion validation',
    purpose: 'Stock in/out/adjustment.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
    note: 'movementUnit must match item configured units.',
  },
  {
    id: 'inventory-adjust-stock',
    category: 'inventory',
    method: 'POST',
    path: '/api/inventory/:id/adjust-stock',
    guard: 'inventory.write',
    purpose: 'Set actual counted stock.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'inventory-batches-list',
    category: 'inventory',
    method: 'GET',
    path: '/api/inventory/:id/batches',
    guard: 'Session required',
    purpose: 'Batch list.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'inventory-batches-create',
    category: 'inventory',
    method: 'POST',
    path: '/api/inventory/:id/batches',
    guard: 'inventory.write',
    purpose: 'Create batch and update stock.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },

  {
    id: 'tasks-list',
    category: 'tasks-audit',
    method: 'GET',
    path: '/api/tasks',
    guard: 'Session required',
    purpose: 'Task board list.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'tasks-create',
    category: 'tasks-audit',
    method: 'POST',
    path: '/api/tasks',
    guard: 'Session required + schema',
    purpose: 'Create task.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'FE',
  },
  {
    id: 'tasks-update',
    category: 'tasks-audit',
    method: 'PATCH',
    path: '/api/tasks/:id',
    guard: 'Session required',
    purpose: 'Update task state/details.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'tasks-complete',
    category: 'tasks-audit',
    method: 'POST',
    path: '/api/tasks/:id/complete',
    guard: 'Session required',
    purpose: 'Complete task.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'Shared',
  },
  {
    id: 'audit-logs',
    category: 'tasks-audit',
    method: 'GET',
    path: '/api/audit/logs',
    guard: 'ai.workspace.view OR owner.workspace.view',
    purpose: 'Audit trail feed.',
    expected: { owner: '200', doctor: '200', assistant: '200', anonymous: '401' },
    primaryOwner: 'BE',
  },
];

const OWNERSHIP_NOTES = {
  be: [
    'Own authentication, tenant resolution, permission checks (401/403), and strict schema validation.',
    'Keep error contracts stable: include clear message + status + field-level issues for 400 errors.',
    'Enforce business invariants (inventory unit conversion, walk-in duplicate prevention, encounter-level vital consistency).',
    'Keep report contracts deterministic (range/date rules, mode policy flags, role scoping).',
  ],
  fe: [
    'Send the correct query model: /api/reports/* uses range, /api/inventory/* reports/alerts use days.',
    'Never call owner-only endpoints from doctor/assistant screens (e.g., /api/users).',
    'Do not mask backend status codes in BFF: pass through status/body to keep root-cause visible.',
    'Map backend snake_case payloads to UI form models and rehydrate local state from save responses.',
    'Invalidate/refetch role-critical queries after mutations (consultation save, inventory movement, staff updates).',
  ],
  shared: [
    'Use request IDs and surface them in notifications for faster traceability across FE + BE logs.',
    'Align endpoint contracts in one source document and update FE types with every BE contract change.',
    'For role/mode-aware screens, filter both data and wording to avoid showing irrelevant metrics.',
  ],
};

function parseStatusCode(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRunnerPillClasses(state: RunnerState) {
  switch (state) {
    case 'running':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'passed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'failed':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'skipped':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
}

function normalizeArrayPayload(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    return payload.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object');
  }
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const record = payload as Record<string, unknown>;
  const candidateKeys = [
    'patients',
    'appointments',
    'encounters',
    'items',
    'tasks',
    'doctors',
    'inventory',
    'data',
    'results',
  ];
  for (const key of candidateKeys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object');
    }
  }
  return [];
}

function getFirstNumericId(rows: Array<Record<string, unknown>>) {
  for (const row of rows) {
    const value = row.id;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function getFirstDiagnosisCode(rows: Array<Record<string, unknown>>) {
  for (const row of rows) {
    const code = row.code;
    if (typeof code === 'string' && code.trim()) {
      return code.trim();
    }
    const icd10Code = row.icd10Code;
    if (typeof icd10Code === 'string' && icd10Code.trim()) {
      return icd10Code.trim();
    }
  }
  return undefined;
}

async function safeGetJson(path: string): Promise<unknown> {
  const response = await fetch(path, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'same-origin',
    headers: {
      'x-endpoint-health-check': '1',
    },
  });
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function buildProbeContext(): Promise<ProbeContext> {
  const [patientsPayload, encountersPayload, appointmentsPayload, inventoryPayload, tasksPayload, diagnosisPayload] =
    await Promise.all([
      safeGetJson('/api/patients'),
      safeGetJson('/api/encounters'),
      safeGetJson('/api/appointments'),
      safeGetJson('/api/inventory'),
      safeGetJson('/api/tasks'),
      safeGetJson('/api/clinical/diagnoses?terms=a&limit=1'),
    ]);

  const patients = normalizeArrayPayload(patientsPayload);
  const encounters = normalizeArrayPayload(encountersPayload);
  const appointments = normalizeArrayPayload(appointmentsPayload);
  const inventoryItems = normalizeArrayPayload(inventoryPayload);
  const tasks = normalizeArrayPayload(tasksPayload);
  const diagnoses = normalizeArrayPayload(diagnosisPayload);

  return {
    patientId: getFirstNumericId(patients),
    encounterId: getFirstNumericId(encounters),
    appointmentId: getFirstNumericId(appointments),
    inventoryId: getFirstNumericId(inventoryItems),
    taskId: getFirstNumericId(tasks),
    diagnosisCode: getFirstDiagnosisCode(diagnoses),
  };
}

function resolveProbePath(endpoint: EndpointChecklistItem, context: ProbeContext) {
  switch (endpoint.id) {
    case 'patients-detail':
      return `/api/patients/${context.patientId ?? 1}`;
    case 'patients-profile':
      return `/api/patients/${context.patientId ?? 1}/profile`;
    case 'patients-consultations':
      return `/api/patients/${context.patientId ?? 1}/consultations`;
    case 'patients-family':
      return `/api/patients/${context.patientId ?? 1}/family`;
    case 'patients-vitals':
      return `/api/patients/${context.patientId ?? 1}/vitals`;
    case 'patients-allergies-list':
      return `/api/patients/${context.patientId ?? 1}/allergies`;
    case 'patients-conditions':
      return `/api/patients/${context.patientId ?? 1}/conditions`;
    case 'patients-timeline':
      return `/api/patients/${context.patientId ?? 1}/timeline`;
    case 'patients-history-list':
      return `/api/patients/${context.patientId ?? 1}/history`;
    case 'appointments-list':
      return '/api/appointments?status=waiting';
    case 'encounters-detail':
      return `/api/encounters/${context.encounterId ?? 1}`;
    case 'clinical-diagnoses':
      return '/api/clinical/diagnoses?terms=a&limit=5';
    case 'clinical-tests':
      return '/api/clinical/tests?terms=a&limit=5';
    case 'clinical-recommended-tests':
      if (!context.diagnosisCode) {
        return null;
      }
      return `/api/clinical/diagnoses/${encodeURIComponent(context.diagnosisCode)}/recommended-tests`;
    case 'clinical-icd10':
      return '/api/clinical/icd10?terms=a&limit=5';
    case 'reports-main':
      return '/api/reports/doctor-performance?range=30d';
    case 'reports-daily-summary':
      return '/api/reports/daily-summary';
    case 'reports-daily-history':
      return '/api/reports/daily-summary/history?limit=5';
    case 'inventory-detail':
      return `/api/inventory/${context.inventoryId ?? 1}`;
    case 'inventory-alerts':
      return '/api/inventory/alerts?days=30';
    case 'inventory-reports':
      return '/api/inventory/reports?days=30';
    case 'inventory-search':
      return '/api/inventory/search?q=a&limit=5';
    case 'inventory-movements-list':
      return `/api/inventory/${context.inventoryId ?? 1}/movements`;
    case 'inventory-batches-list':
      return `/api/inventory/${context.inventoryId ?? 1}/batches`;
    case 'tasks-list':
      return '/api/tasks';
    case 'audit-logs':
      return '/api/audit/logs?limit=5';
    default:
      if (endpoint.path.includes(':id')) {
        return null;
      }
      if (endpoint.path.includes(':reportType')) {
        return '/api/reports/doctor-performance?range=30d';
      }
      if (endpoint.path.includes('?')) {
        return endpoint.path;
      }
      if (endpoint.path.includes('...')) {
        return endpoint.path.replace('...', 'a');
      }
      return endpoint.path;
  }
}

function getRunnerStateLabel(state: RunnerState) {
  switch (state) {
    case 'running':
      return 'Running';
    case 'passed':
      return 'Passed';
    case 'failed':
      return 'Failed';
    case 'skipped':
      return 'Skipped';
    default:
      return 'Idle';
  }
}

async function parseProbeFailureMessage(response: Response) {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as Record<string, unknown>;
      if (typeof payload.error === 'string' && payload.error.trim()) {
        return payload.error.trim();
      }
      if (typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message.trim();
      }
      const issues = payload.issues;
      if (Array.isArray(issues) && issues.length) {
        const firstIssue = issues[0];
        if (firstIssue && typeof firstIssue === 'object' && typeof (firstIssue as Record<string, unknown>).message === 'string') {
          return String((firstIssue as Record<string, unknown>).message);
        }
      }
    } catch {
      // Fall through to text/status parsing.
    }
  }

  try {
    const text = await response.text();
    if (text.trim()) {
      return text.trim().slice(0, 240);
    }
  } catch {
    // Fall through to status text.
  }

  return response.statusText || 'Request failed';
}

function getStatusClasses(status: string) {
  const numeric = Number.parseInt(status, 10);
  if (Number.isNaN(numeric)) {
    return 'border-slate-200 bg-slate-50 text-slate-700';
  }
  if (numeric >= 200 && numeric < 300) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (numeric >= 400 && numeric < 500) {
    return 'border-amber-200 bg-amber-50 text-amber-800';
  }
  if (numeric >= 500) {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex min-w-[52px] items-center justify-center rounded-full border px-2 py-1 text-[0.68rem] font-semibold ${getStatusClasses(
        value
      )}`}
    >
      {value}
    </span>
  );
}

function MethodBadge({ method }: { method: EndpointChecklistItem['method'] }) {
  const classes =
    method === 'GET'
      ? 'border-sky-200 bg-sky-50 text-sky-700'
      : method === 'POST'
        ? 'border-violet-200 bg-violet-50 text-violet-700'
        : method === 'PATCH'
          ? 'border-amber-200 bg-amber-50 text-amber-800'
          : 'border-rose-200 bg-rose-50 text-rose-700';

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[0.65rem] font-bold tracking-[0.14em] ${classes}`}>
      {method}
    </span>
  );
}

function OwnerBadge({ owner }: { owner: EndpointChecklistItem['primaryOwner'] }) {
  const classes =
    owner === 'BE'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : owner === 'FE'
        ? 'border-sky-200 bg-sky-50 text-sky-700'
        : 'border-violet-200 bg-violet-50 text-violet-700';

  return <span className={`inline-flex rounded-full border px-2 py-1 text-[0.65rem] font-bold ${classes}`}>{owner}</span>;
}

export default function EndpointHealthChecklistSection() {
  const userQuery = useCurrentUserQuery();
  const sessionRole = (userQuery.data?.active_role ?? userQuery.data?.role ?? null) as AppRole | null;
  const activeRole = (sessionRole === 'owner' || sessionRole === 'doctor' || sessionRole === 'assistant' ? sessionRole : 'owner') as AppRole;
  const runnerRole: RoleSlot =
    sessionRole === 'owner' || sessionRole === 'doctor' || sessionRole === 'assistant' ? sessionRole : 'anonymous';
  const [selectedCategory, setSelectedCategory] = useState<'all' | EndpointCategory>('all');
  const [searchText, setSearchText] = useState('');
  const [focusRole, setFocusRole] = useState<RoleSlot>(activeRole === 'owner' ? 'owner' : activeRole);
  const [isRunningChecks, setIsRunningChecks] = useState(false);
  const [runResults, setRunResults] = useState<Record<string, EndpointRunResult>>({});

  const filteredEndpoints = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    return ENDPOINTS.filter((endpoint) => {
      const categoryMatch = selectedCategory === 'all' || endpoint.category === selectedCategory;
      if (!categoryMatch) return false;
      if (!normalizedSearch) return true;
      const haystack = `${endpoint.path} ${endpoint.purpose} ${endpoint.guard} ${endpoint.note ?? ''}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [searchText, selectedCategory]);

  const focusRoleStats = useMemo(() => {
    const rows = filteredEndpoints.map((endpoint) => endpoint.expected[focusRole]);
    const success = rows.filter((value) => value.startsWith('2')).length;
    const unauthorized = rows.filter((value) => value.startsWith('401')).length;
    const forbidden = rows.filter((value) => value.startsWith('403')).length;
    const other = rows.length - success - unauthorized - forbidden;
    return { total: rows.length, success, unauthorized, forbidden, other };
  }, [filteredEndpoints, focusRole]);

  const runnerStats = useMemo(() => {
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let running = 0;
    let idle = 0;

    for (const endpoint of filteredEndpoints) {
      const state = runResults[endpoint.id]?.state ?? 'idle';
      if (state === 'passed') passed += 1;
      else if (state === 'failed') failed += 1;
      else if (state === 'skipped') skipped += 1;
      else if (state === 'running') running += 1;
      else idle += 1;
    }

    return { passed, failed, skipped, running, idle };
  }, [filteredEndpoints, runResults]);

  const clearRunnerResults = useCallback(() => {
    setRunResults({});
  }, []);

  const runAutoCheck = useCallback(async () => {
    if (isRunningChecks) return;

    const endpointsToRun = [...filteredEndpoints];
    setIsRunningChecks(true);

    try {
      const checkedAt = new Date().toISOString();
      setRunResults((prev) => {
        const next = { ...prev };
        for (const endpoint of endpointsToRun) {
          next[endpoint.id] = {
            state: endpoint.method === 'GET' ? 'running' : 'skipped',
            checkedAt,
            expected: endpoint.expected[runnerRole],
            message: endpoint.method === 'GET' ? undefined : 'Auto-check runs GET endpoints only.',
          };
        }
        return next;
      });

      const context = await buildProbeContext();

      for (const endpoint of endpointsToRun) {
        const expected = endpoint.expected[runnerRole];
        const checkedAtEndpoint = new Date().toISOString();

        if (endpoint.method !== 'GET') {
          setRunResults((prev) => ({
            ...prev,
            [endpoint.id]: {
              state: 'skipped',
              checkedAt: checkedAtEndpoint,
              expected,
              message: 'Auto-check runs GET endpoints only.',
            },
          }));
          continue;
        }

        const probePath = resolveProbePath(endpoint, context);
        if (!probePath) {
          setRunResults((prev) => ({
            ...prev,
            [endpoint.id]: {
              state: 'skipped',
              checkedAt: checkedAtEndpoint,
              expected,
              message: 'Skipped: requires an existing id/code context.',
            },
          }));
          continue;
        }

        const expectedStatus = parseStatusCode(expected);
        if (!expectedStatus) {
          setRunResults((prev) => ({
            ...prev,
            [endpoint.id]: {
              state: 'skipped',
              checkedAt: checkedAtEndpoint,
              expected,
              path: probePath,
              message: 'Skipped: expected status is not numeric.',
            },
          }));
          continue;
        }

        const startedAt = performance.now();

        try {
          const response = await fetch(probePath, {
            method: 'GET',
            cache: 'no-store',
            credentials: 'same-origin',
            headers: {
              'x-endpoint-health-check': '1',
            },
          });
          const durationMs = Math.max(1, Math.round(performance.now() - startedAt));
          const passed = response.status === expectedStatus;
          const message = passed ? undefined : await parseProbeFailureMessage(response);

          setRunResults((prev) => ({
            ...prev,
            [endpoint.id]: {
              state: passed ? 'passed' : 'failed',
              checkedAt: new Date().toISOString(),
              durationMs,
              expected,
              actual: response.status,
              path: probePath,
              message,
            },
          }));
        } catch (error) {
          const durationMs = Math.max(1, Math.round(performance.now() - startedAt));
          const message = error instanceof Error ? error.message : 'Network failure during probe.';
          setRunResults((prev) => ({
            ...prev,
            [endpoint.id]: {
              state: 'failed',
              checkedAt: new Date().toISOString(),
              durationMs,
              expected,
              path: probePath,
              message,
            },
          }));
        }
      }
    } finally {
      setIsRunningChecks(false);
    }
  }, [filteredEndpoints, isRunningChecks, runnerRole]);

  return (
    <ViewportPage className="h-full overflow-hidden">
      <ViewportFrame>
        <ViewportBody className="flex min-h-0 flex-col gap-3 overflow-hidden px-4 py-3 sm:px-5 sm:py-4 lg:px-6">
          <ViewportHeader
            eyebrow="Endpoint Governance"
            title="API Endpoint Health Checklist"
            description="Strict role-based expectations for every frontend-consumed endpoint, with clear BE/FE ownership on failures."
            actions={(
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/analytics"
                  className="rounded-2xl border border-sky-200 bg-white px-4 py-2 text-xs font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
                >
                  Back to Analytics
                </Link>
                <Link
                  href="/dashboard/daily-summary"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Daily Summary
                </Link>
              </div>
            )}
          />

          <div className="grid gap-3 rounded-[20px] border border-slate-200/80 bg-white/92 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ring-1 ring-sky-50/70 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Category</p>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value as 'all' | EndpointCategory)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none ring-sky-200 transition focus:ring-2"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Search Endpoint</p>
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="path, guard, or note..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none ring-sky-200 transition focus:ring-2"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Role Focus</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ROLE_LABELS) as RoleSlot[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFocusRole(role)}
                    className={
                      role === focusRole
                        ? 'rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white'
                        : 'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700'
                    }
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Focus Summary ({ROLE_LABELS[focusRole]})
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
                <span>Total: {focusRoleStats.total}</span>
                <span>2xx: {focusRoleStats.success}</span>
                <span>401: {focusRoleStats.unauthorized}</span>
                <span>403: {focusRoleStats.forbidden}</span>
              </div>
              <div className="mt-3 border-t border-slate-200 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Runner Role: {ROLE_LABELS[runnerRole]}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-600">
                  <span>Passed {runnerStats.passed}</span>
                  <span>Failed {runnerStats.failed}</span>
                  <span>Skipped {runnerStats.skipped}</span>
                  <span>Idle {runnerStats.idle}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={runAutoCheck}
                    disabled={isRunningChecks || !filteredEndpoints.length}
                    className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRunningChecks ? 'Running...' : 'Run Auto-Check'}
                  </button>
                  <button
                    type="button"
                    onClick={clearRunnerResults}
                    disabled={!Object.keys(runResults).length || isRunningChecks}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear Results
                  </button>
                </div>
              </div>
            </div>
          </div>

          <ViewportScrollBody className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            <div className="overflow-hidden rounded-[20px] border border-slate-200/80 bg-white/92 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ring-1 ring-sky-50/70">
              <div className="overflow-auto">
                <table className="min-w-[1360px] w-full border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                    <tr className="text-left text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-3 py-3">Method</th>
                      <th className="px-3 py-3">Endpoint</th>
                      <th className="px-3 py-3">Guard</th>
                      <th className="px-3 py-3">Owner</th>
                      <th className="px-3 py-3">Doctor</th>
                      <th className="px-3 py-3">Assistant</th>
                      <th className="px-3 py-3">No Session</th>
                      <th className="px-3 py-3">Primary Owner</th>
                      <th className="px-3 py-3">Note</th>
                      <th className="px-3 py-3">Live Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEndpoints.map((endpoint) => (
                      <tr key={endpoint.id} className="border-t border-slate-100 align-top text-sm text-slate-700">
                        <td className="px-3 py-2.5">
                          <MethodBadge method={endpoint.method} />
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-900">{endpoint.path}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{endpoint.purpose}</p>
                        </td>
                        <td className="px-3 py-2.5 text-[12px] text-slate-600">{endpoint.guard}</td>
                        <td className="px-3 py-2.5"><StatusBadge value={endpoint.expected.owner} /></td>
                        <td className="px-3 py-2.5"><StatusBadge value={endpoint.expected.doctor} /></td>
                        <td className="px-3 py-2.5"><StatusBadge value={endpoint.expected.assistant} /></td>
                        <td className="px-3 py-2.5"><StatusBadge value={endpoint.expected.anonymous} /></td>
                        <td className="px-3 py-2.5"><OwnerBadge owner={endpoint.primaryOwner} /></td>
                        <td className="px-3 py-2.5 text-[12px] text-slate-600">{endpoint.note ?? '--'}</td>
                        <td className="min-w-[240px] px-3 py-2.5">
                          {(() => {
                            const result = runResults[endpoint.id];
                            const state = result?.state ?? 'idle';
                            const expectedForRole = result?.expected ?? endpoint.expected[runnerRole];
                            const actualStatus = typeof result?.actual === 'number' ? String(result.actual) : '--';

                            return (
                              <div className="space-y-1">
                                <span
                                  className={`inline-flex rounded-full border px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${getRunnerPillClasses(
                                    state
                                  )}`}
                                >
                                  {getRunnerStateLabel(state)}
                                </span>
                                <p className="text-[11px] text-slate-600">
                                  Expected: {expectedForRole} | Actual: {actualStatus}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {result?.durationMs ? `Time: ${result.durationMs}ms` : '--'}
                                </p>
                                {result?.message ? <p className="text-[11px] text-rose-700">{result.message}</p> : null}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                    {!filteredEndpoints.length ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                          No endpoints matched your filters.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-3">
              <div className="rounded-[20px] border border-emerald-200/70 bg-emerald-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">Handle In BE</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-emerald-900">
                  {OWNERSHIP_NOTES.be.map((note) => (
                    <li key={note}>- {note}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[20px] border border-sky-200/70 bg-sky-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">Handle In FE</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-sky-900">
                  {OWNERSHIP_NOTES.fe.map((note) => (
                    <li key={note}>- {note}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[20px] border border-violet-200/70 bg-violet-50/60 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700">Shared BE + FE</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-violet-900">
                  {OWNERSHIP_NOTES.shared.map((note) => (
                    <li key={note}>- {note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </ViewportScrollBody>
        </ViewportBody>
      </ViewportFrame>
    </ViewportPage>
  );
}
