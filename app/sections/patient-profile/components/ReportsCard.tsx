'use client';

import { useQuery } from '@tanstack/react-query';
import { documentRawUrl, listPatientDocuments } from '../../../lib/api-client';

type AnyRecord = Record<string, unknown>;
const str = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
const num = (value: unknown): number | null => (typeof value === 'number' ? value : null);

export function ReportsCard({ profileId }: { profileId: string }) {
    const documents = useQuery({
        queryKey: ['patient-documents', profileId],
        queryFn: () => listPatientDocuments(profileId),
        enabled: Boolean(profileId),
    });

    const rows = (documents.data ?? []) as AnyRecord[];

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Reports &amp; Documents</h3>
                {rows.length > 0 ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{rows.length}</span>
                ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                {documents.isLoading ? (
                    <p className="text-sm text-slate-400">Loading…</p>
                ) : rows.length === 0 ? (
                    <p className="text-sm text-slate-400">No documents uploaded for this patient yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {rows.map((doc) => {
                            const id = num(doc.id);
                            const uploadedAt = new Date(str(doc.uploadedAt));
                            const source = str(doc.source);
                            const sourceLabel = source === 'assistant' ? 'Assistant' : source === 'patient' ? 'Patient' : null;
                            return (
                                <li
                                    key={id ?? str(doc.fileName)}
                                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-800">{str(doc.fileName, 'Document')}</p>
                                        <p className="text-xs text-slate-500">
                                            {sourceLabel ? (
                                                <span className="mr-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                                    {sourceLabel}
                                                </span>
                                            ) : null}
                                            {uploadedAt.toLocaleDateString()}{' '}
                                            {uploadedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {str(doc.uploadedByName) ? ` · ${str(doc.uploadedByName)}` : ''}
                                        </p>
                                        {str(doc.note) ? <p className="mt-0.5 truncate text-xs text-slate-400">“{str(doc.note)}”</p> : null}
                                    </div>
                                    {id != null ? (
                                        <a
                                            href={documentRawUrl(id)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100 hover:bg-sky-100"
                                        >
                                            Open
                                        </a>
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
