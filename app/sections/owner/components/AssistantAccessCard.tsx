'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getClinicSettings, updateAssistantAccess } from '../../../lib/api-client';
import { notifyError, notifySuccess } from '../../../lib/notifications';

// Friendly labels for the pages an owner can grant assistants.
const PAGE_LABELS: Record<string, string> = {
  assistant: 'Assistant Workspace',
  patient: 'Patient Management',
  inventory: 'Inventory',
  analytics: 'Analytics',
  tasks: 'Tasks',
  ai: 'AI Tools',
  documents: 'Documents',
};

export function AssistantAccessCard() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({ queryKey: ['clinicSettings'], queryFn: getClinicSettings });

  const toggleablePages = useMemo(
    () => settingsQuery.data?.assistant_toggleable_pages ?? Object.keys(PAGE_LABELS),
    [settingsQuery.data],
  );
  // null on the server = all pages allowed.
  const serverAccess = settingsQuery.data?.assistant_access ?? null;
  const [draft, setDraft] = useState<string[] | null>(null);
  const allowed = draft ?? serverAccess ?? toggleablePages;

  const isOn = (page: string) => allowed.includes(page);
  const toggle = (page: string) => {
    const next = isOn(page) ? allowed.filter((p) => p !== page) : [...allowed, page];
    setDraft(next);
  };

  const save = useMutation({
    // If every page is on, store null ("all pages") to keep it future-proof.
    mutationFn: () => {
      const value = allowed.length === toggleablePages.length ? null : allowed;
      return updateAssistantAccess(value);
    },
    onSuccess: async () => {
      setDraft(null);
      await queryClient.invalidateQueries({ queryKey: ['clinicSettings'] });
      notifySuccess('Assistant access updated.');
    },
    onError: (error) => notifyError((error as { message?: string })?.message ?? 'Unable to update assistant access.'),
  });

  const dirty = draft !== null;

  return (
    <div className="ios-surface rounded-[24px] p-5 md:p-6">
      <div className="mb-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-600">Assistant Access</p>
        <h3 className="text-lg font-black tracking-tight text-slate-900">Pages assistants can open</h3>
        <p className="text-sm text-slate-500">
          Doctors always have full access. Choose which pages this clinic&apos;s assistants can use.
        </p>
      </div>

      {settingsQuery.isLoading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {toggleablePages.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => toggle(page)}
                className={`flex items-center justify-between rounded-2xl border px-3.5 py-2.5 text-left transition ${
                  isOn(page)
                    ? 'border-sky-200 bg-sky-50 text-sky-900'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span className="text-sm font-semibold">{PAGE_LABELS[page] ?? page}</span>
                <span
                  className={`ml-3 inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition ${
                    isOn(page) ? 'justify-end bg-sky-600' : 'justify-start bg-slate-300'
                  }`}
                >
                  <span className="h-4 w-4 rounded-full bg-white shadow" />
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!dirty || save.isPending}
            onClick={() => save.mutate()}
            className="mt-4 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : 'Save access'}
          </button>
        </>
      )}
    </div>
  );
}
