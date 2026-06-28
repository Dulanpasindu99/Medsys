'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateClinicOperatingMode, type OperatingMode } from '../../../lib/api-client';
import { useCurrentUserQuery } from '../../../lib/query-hooks';
import { queryKeys } from '../../../lib/query-keys';
import { notifyError, notifySuccess } from '../../../lib/notifications';

const MODES: Array<{ value: OperatingMode; title: string; description: string }> = [
  {
    value: 'standard',
    title: 'Standard',
    description:
      'Walk-in and appointment workflows with the full assistant scheduling tools.',
  },
  {
    value: 'step_up',
    title: 'Step Up',
    description:
      'First-come, first-served walk-ins only. No appointments; assistants capture the medicine price (LKR) at dispense.',
  },
];

export function OwnerClinicModeCard() {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUserQuery();
  const currentMode: OperatingMode =
    currentUserQuery.data?.operating_mode === 'step_up' ? 'step_up' : 'standard';

  const mutation = useMutation({
    mutationFn: (operatingMode: OperatingMode) => updateClinicOperatingMode(operatingMode),
    onSuccess: async (_data, operatingMode) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
      notifySuccess(
        operatingMode === 'step_up'
          ? 'Clinic switched to Step Up mode.'
          : 'Clinic switched to Standard mode.',
      );
    },
    onError: (error) => {
      notifyError((error as { message?: string })?.message ?? 'Unable to update clinic mode.');
    },
  });

  const handleSelect = (mode: OperatingMode) => {
    if (mode === currentMode || mutation.isPending) {
      return;
    }
    const confirmed = window.confirm(
      mode === 'step_up'
        ? 'Switch the whole clinic to Step Up mode? Appointment scheduling will be disabled and assistants will capture medicine prices (LKR) at dispense.'
        : 'Switch the whole clinic back to Standard mode? Appointment scheduling will be re-enabled.',
    );
    if (!confirmed) {
      return;
    }
    mutation.mutate(mode);
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.10)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Clinic Operating Mode</h2>
          <p className="mt-1 text-sm text-slate-500">
            Controls how the whole clinic works for every doctor and assistant.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">
          {currentUserQuery.isPending
            ? 'Loading'
            : currentMode === 'step_up'
              ? 'Step Up'
              : 'Standard'}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {MODES.map((mode) => {
          const isActive = mode.value === currentMode;
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => handleSelect(mode.value)}
              disabled={mutation.isPending || currentUserQuery.isPending}
              aria-pressed={isActive}
              className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isActive
                  ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-100'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{mode.title}</span>
                {isActive ? (
                  <span className="rounded-full bg-sky-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                    Active
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 text-xs font-medium text-slate-500">{mode.description}</p>
            </button>
          );
        })}
      </div>
      {mutation.isPending ? (
        <p className="mt-3 text-xs font-semibold text-slate-500">Updating clinic mode...</p>
      ) : null}
    </section>
  );
}
