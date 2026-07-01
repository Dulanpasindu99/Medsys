"use client";

import { useQuery } from "@tanstack/react-query";
import { documentRawUrl, listPatientDocuments } from "../../../lib/api-client";

type DocumentRecord = {
  id: number;
  fileName: string;
  contentType: string;
  uploadedAt: string;
  source?: string;
  note?: string | null;
  uploadedByName?: string | null;
};

export function DocumentsPanel({ patientId }: { patientId?: string | null }) {
  const enabled = Boolean(patientId);
  const documents = useQuery({
    queryKey: ["patient-documents", patientId],
    queryFn: () => listPatientDocuments(patientId as string),
    enabled
  });

  if (!enabled) {
    return <p className="p-4 text-sm text-slate-500">Select a patient to view shared documents.</p>;
  }

  return (
    <div className="space-y-2 p-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Reports &amp; documents
      </p>
      {documents.isLoading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : documents.data && documents.data.length > 0 ? (
        <ul className="space-y-2">
          {documents.data.map((doc) => {
            const record = doc as DocumentRecord;
            const uploadedAt = new Date(record.uploadedAt);
            const sourceLabel = record.source === "assistant" ? "Assistant" : "Patient";
            return (
              <li
                key={record.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{record.fileName}</p>
                  <p className="text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {sourceLabel}
                    </span>{" "}
                    {uploadedAt.toLocaleDateString()} {uploadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {record.uploadedByName ? ` · ${record.uploadedByName}` : ""}
                  </p>
                  {record.note ? <p className="mt-0.5 truncate text-xs text-slate-400">“{record.note}”</p> : null}
                </div>
                <a
                  href={documentRawUrl(record.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100 hover:bg-sky-100"
                >
                  Open
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No documents shared yet.</p>
      )}
    </div>
  );
}
