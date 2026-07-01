"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentRawUrl, listPatientDocuments, markDocumentReviewed } from "../../../lib/api-client";
import { notifyError } from "../../../lib/notifications";

type DocumentRecord = {
  id: number;
  fileName: string;
  contentType: string;
  uploadedAt: string;
  source?: string;
  note?: string | null;
  uploadedByName?: string | null;
  reviewedAt?: string | null;
};

export function DocumentsPanel({
  patientId,
  onUnreviewedChange,
}: {
  patientId?: string | null;
  onUnreviewedChange?: (ids: number[]) => void;
}) {
  const enabled = Boolean(patientId);
  const queryClient = useQueryClient();
  const [showPast, setShowPast] = useState(false);

  const documents = useQuery({
    queryKey: ["patient-documents", patientId],
    queryFn: () => listPatientDocuments(patientId as string),
    enabled,
  });

  const review = useMutation({
    mutationFn: (id: number) => markDocumentReviewed(id, true),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patient-documents", patientId] }),
    onError: (error) => notifyError((error as Error)?.message ?? "Could not mark reviewed."),
  });

  const all = useMemo(() => (documents.data ?? []) as DocumentRecord[], [documents.data]);
  const pending = useMemo(() => all.filter((doc) => !doc.reviewedAt), [all]);
  const reviewed = useMemo(() => all.filter((doc) => doc.reviewedAt), [all]);

  // Report the unreviewed doc ids up so the workspace can prompt on tab switch.
  useEffect(() => {
    onUnreviewedChange?.(pending.map((doc) => doc.id));
  }, [pending, onUnreviewedChange]);

  if (!enabled) {
    return <p className="p-4 text-sm text-slate-500">Select a patient to view shared documents.</p>;
  }

  const renderDoc = (doc: DocumentRecord) => {
    const uploadedAt = new Date(doc.uploadedAt);
    const sourceLabel = doc.source === "assistant" ? "Assistant" : doc.source === "patient" ? "Patient" : null;
    return (
      <li key={doc.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{doc.fileName}</p>
          <p className="text-xs text-slate-500">
            {sourceLabel ? (
              <span className="mr-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{sourceLabel}</span>
            ) : null}
            {uploadedAt.toLocaleDateString()} {uploadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {doc.uploadedByName ? ` · ${doc.uploadedByName}` : ""}
          </p>
          {doc.note ? <p className="mt-0.5 truncate text-xs text-slate-400">“{doc.note}”</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {doc.reviewedAt ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Reviewed</span>
          ) : (
            <button
              type="button"
              disabled={review.isPending}
              onClick={() => review.mutate(doc.id)}
              className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100 disabled:opacity-50"
            >
              Mark reviewed
            </button>
          )}
          <a
            href={documentRawUrl(doc.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100 hover:bg-sky-100"
          >
            Open
          </a>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-2 p-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Reports &amp; documents</p>
      {documents.isLoading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : all.length === 0 ? (
        <p className="text-sm text-slate-500">No documents shared yet.</p>
      ) : (
        <>
          {pending.length > 0 ? <ul className="space-y-2">{pending.map(renderDoc)}</ul> : (
            <p className="text-sm text-slate-500">No reports awaiting review.</p>
          )}

          {reviewed.length > 0 ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowPast((prev) => !prev)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                {showPast ? "Hide" : "See"} past reports ({reviewed.length})
              </button>
              {showPast ? <ul className="mt-2 space-y-2">{reviewed.map(renderDoc)}</ul> : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
