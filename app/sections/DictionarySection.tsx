'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDictionaryTerms,
  updateDictionaryTerm,
  deleteDictionaryTerm,
  type DictionaryTermType,
} from '../lib/api-client';
import { notifyError, notifySuccess } from '../lib/notifications';
import { AsyncStatePanel } from '../components/ui/AsyncStatePanel';
import { ViewportBody, ViewportFrame, ViewportPage } from '../components/ui/ViewportLayout';

const TABS: Array<{ type: DictionaryTermType; label: string; blurb: string }> = [
  { type: 'diagnosis', label: 'Diagnoses', blurb: 'Conditions you have recorded in consultations.' },
  { type: 'test', label: 'Medical Tests', blurb: 'Investigations you have ordered.' },
  { type: 'drug', label: 'Outside Drugs', blurb: 'Drug names you have typed in prescriptions.' },
];

function errorMessage(error: unknown, fallback: string) {
  const candidate = error as { userMessage?: string; message?: string } | undefined;
  return candidate?.userMessage ?? candidate?.message ?? fallback;
}

function formatLastUsed(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB');
}

export default function DictionarySection() {
  const queryClient = useQueryClient();
  const [activeType, setActiveType] = useState<DictionaryTermType>('diagnosis');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const termsQuery = useQuery({
    queryKey: ['dictionary', 'terms', activeType],
    queryFn: () => getDictionaryTerms(activeType),
    staleTime: 30_000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['dictionary', 'terms', activeType] });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateDictionaryTerm(id, name),
    onSuccess: () => {
      setEditingId(null);
      setEditValue('');
      notifySuccess('Term updated.');
      void invalidate();
    },
    onError: (error: unknown) => notifyError(errorMessage(error, 'Could not rename the term.')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDictionaryTerm(id),
    onSuccess: () => {
      notifySuccess('Term removed.');
      void invalidate();
    },
    onError: (error: unknown) => notifyError(errorMessage(error, 'Could not delete the term.')),
  });

  const terms = termsQuery.data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? terms.filter((term) => term.name.toLowerCase().includes(q)) : terms;
  }, [terms, search]);

  const activeTab = TABS.find((tab) => tab.type === activeType) ?? TABS[0];

  const startEdit = (id: number, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };

  const commitEdit = (id: number) => {
    const next = editValue.trim();
    if (!next) {
      notifyError('Term name cannot be empty.');
      return;
    }
    updateMutation.mutate({ id, name: next });
  };

  return (
    <ViewportPage className="h-full min-h-0 text-slate-900">
      <ViewportFrame className="h-full max-w-[2200px] bg-[linear-gradient(135deg,rgba(255,255,255,0.94)_0%,rgba(241,245,249,0.96)_42%,rgba(219,234,254,0.94)_100%)] shadow-[0_18px_42px_rgba(28,63,99,0.12)] ring-sky-50/80 sm:rounded-[28px]">
        <ViewportBody className="relative overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
            <header className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                Clinical Dictionary
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">My Dictionary</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                Terms you type while seeing patients are saved here and power your autocomplete
                suggestions. Rename or remove anything that is wrong or no longer useful.
              </p>
            </header>

            <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-slate-200/80 bg-white/90 p-2 ring-1 ring-sky-50/70">
              {TABS.map((tab) => {
                const active = tab.type === activeType;
                return (
                  <button
                    key={tab.type}
                    type="button"
                    onClick={() => {
                      setActiveType(tab.type);
                      setEditingId(null);
                      setSearch('');
                    }}
                    className={
                      active
                        ? 'rounded-full bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white'
                        : 'rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 transition hover:bg-slate-100 hover:text-slate-800'
                    }
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-600">{activeTab.blurb}</p>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Search ${activeTab.label.toLowerCase()}…`}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 sm:w-64"
                />
              </div>

              {termsQuery.isPending ? (
                <AsyncStatePanel
                  eyebrow="Loading"
                  title="Loading your terms"
                  description="Fetching your saved dictionary entries."
                  tone="loading"
                />
              ) : termsQuery.isError ? (
                <AsyncStatePanel
                  eyebrow="Error"
                  title="Could not load dictionary"
                  description={errorMessage(termsQuery.error, 'Please try again.')}
                  tone="error"
                />
              ) : filtered.length === 0 ? (
                <AsyncStatePanel
                  eyebrow="Empty"
                  title={search.trim() ? 'No matching terms' : 'No terms yet'}
                  description={
                    search.trim()
                      ? 'Try a different search.'
                      : `${activeTab.label} you record in consultations will appear here automatically.`
                  }
                  tone="empty"
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map((term) => {
                    const isEditing = editingId === term.id;
                    const busy =
                      (updateMutation.isPending && updateMutation.variables?.id === term.id) ||
                      (deleteMutation.isPending && deleteMutation.variables === term.id);
                    return (
                      <li key={term.id} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <input
                              value={editValue}
                              autoFocus
                              onChange={(event) => setEditValue(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') commitEdit(term.id);
                                if (event.key === 'Escape') setEditingId(null);
                              }}
                              className="h-9 w-full rounded-lg border border-sky-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-sky-100"
                            />
                          ) : (
                            <>
                              <p className="truncate text-sm font-semibold text-slate-900">{term.name}</p>
                              <p className="text-[11px] font-medium text-slate-400">
                                Used {term.usage_count}× · last {formatLastUsed(term.last_used_at)}
                              </p>
                            </>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => commitEdit(term.id)}
                              className="app-button app-button--primary h-9 px-4 text-xs"
                            >
                              {busy ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="app-button app-button--soft h-9 px-4 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => startEdit(term.id, term.name)}
                              className="app-button app-button--soft h-9 px-4 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                if (
                                  typeof window !== 'undefined' &&
                                  window.confirm(`Delete "${term.name}" from your dictionary?`)
                                ) {
                                  deleteMutation.mutate(term.id);
                                }
                              }}
                              className="app-button h-9 px-4 text-xs text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
                            >
                              {busy ? '…' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </ViewportBody>
      </ViewportFrame>
    </ViewportPage>
  );
}
