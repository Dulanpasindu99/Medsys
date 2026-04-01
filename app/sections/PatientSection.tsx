'use client';

import { useEffect, useMemo, useState } from 'react';
import { AsyncNotice, AsyncStatePanel } from '../components/ui/AsyncStatePanel';
import {
  ViewportBody,
  ViewportFrame,
  ViewportPage,
  ViewportScrollBody,
} from '../components/ui/ViewportLayout';
import { PatientProfileModal } from '../components/PatientProfileModal';
import { usePatientProfilePopup } from '../hooks/usePatientProfilePopup';
import { PatientFilters } from './patient/components/PatientFilters';
import { PatientHeader } from './patient/components/PatientHeader';
import { PatientRecordCard } from './patient/components/PatientRecordCard';
import { SectionShell } from './patient/components/PatientPrimitives';
import { usePatientDirectory } from './patient/hooks/usePatientDirectory';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 31] as const;

export default function PatientSection() {
  const {
    search,
    setSearch,
    family,
    setFamily,
    ageRange,
    setAgeRange,
    gender,
    setGender,
    patients,
    filteredPatients,
    families,
    loadState,
    reload,
  } = usePatientDirectory();
  const popup = usePatientProfilePopup();
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const isInitialLoading = loadState.status === 'loading' && patients.length === 0;
  const isHardError = loadState.status === 'error' && patients.length === 0;
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [currentPage, filteredPatients, pageSize]);

  let recordsTitle = `${filteredPatients.length} of ${patients.length} patients`;
  let recordsBadge = `${patients.length * 8}+ total visits`;

  if (isInitialLoading) {
    recordsTitle = 'Loading patient records';
    recordsBadge = 'Preparing summaries';
  } else if (isHardError) {
    recordsTitle = 'Patient records unavailable';
    recordsBadge = 'Summary unavailable';
  } else if (loadState.status === 'empty') {
    recordsTitle = 'No patients available';
    recordsBadge = '0 total visits';
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [search, family, ageRange, gender, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <ViewportPage>
      <ViewportFrame>
        <ViewportBody className="gap-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <PatientHeader />
            <button
              type="button"
              onClick={reload}
              disabled={loadState.status === 'loading'}
              className="ios-button-primary rounded-2xl px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadState.status === 'loading' ? 'Refreshing...' : 'Refresh patients'}
            </button>
          </div>

          {loadState.error ? <AsyncNotice tone="error" message={loadState.error} /> : null}
          {loadState.notice ? <AsyncNotice tone="warning" message={loadState.notice} /> : null}

          <SectionShell>
            <PatientFilters
              search={search}
              setSearch={setSearch}
              gender={gender}
              setGender={setGender}
              family={family}
              setFamily={setFamily}
              families={families}
              ageRange={ageRange}
              setAgeRange={setAgeRange}
              filteredCount={filteredPatients.length}
            />
          </SectionShell>

          <SectionShell className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Patient records</p>
                <h2 className="text-xl font-bold text-slate-900">{recordsTitle}</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-700">
                <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700 ring-1 ring-emerald-100">
                  {recordsBadge}
                </span>
                <span className="rounded-full bg-sky-50 px-3 py-2 text-sky-700 ring-1 ring-sky-100">Filters ready</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]">
              <div className="text-sm font-semibold text-slate-700">
                Showing {filteredPatients.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                {' - '}
                {Math.min(currentPage * pageSize, filteredPatients.length)} of {filteredPatients.length}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Per page</span>
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-sky-300 focus:outline-none"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-semibold text-slate-700">
                    Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage >= totalPages}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            <ViewportScrollBody className="mt-5 min-h-0 flex-1 pr-3 pb-6">
              <div className="space-y-4 pb-12">
                {loadState.status === 'loading' ? (
                  <AsyncStatePanel
                    eyebrow="Loading"
                    title="Loading patient records"
                    description="Patient demographics, families, and timeline summaries are being prepared."
                    tone="loading"
                  />
                ) : loadState.status === 'error' && !patients.length ? (
                  <AsyncStatePanel
                    eyebrow="Error"
                    title="Patient records could not be loaded"
                    description={loadState.error ?? 'The patient directory is unavailable right now.'}
                    tone="error"
                    actionLabel="Retry patients"
                    onAction={reload}
                  />
                ) : loadState.status === 'empty' ? (
                  <AsyncStatePanel
                    eyebrow="Empty"
                    title="No patients available"
                    description="No patient records were returned for this workspace yet."
                    tone="empty"
                  />
                ) : filteredPatients.length === 0 ? (
                  <AsyncStatePanel
                    eyebrow="No matches"
                    title="No patients match the current filters"
                    description="Adjust the search text or filter chips to widen the result set."
                    tone="empty"
                  />
                ) : (
                  paginatedPatients.map((patient) => (
                    <PatientRecordCard
                      key={patient.patientId ?? patient.patientCode ?? `${patient.nic}-${patient.name}`}
                      patient={patient}
                      onViewProfile={popup.openProfile}
                    />
                  ))
                )}
              </div>
            </ViewportScrollBody>
          </SectionShell>
        </ViewportBody>
      </ViewportFrame>
      <PatientProfileModal profileId={popup.selectedProfileId || ''} onClose={popup.closeProfile} />
    </ViewportPage>
  );
}
