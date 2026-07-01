"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  documentRawUrl,
  listPatientDocuments,
  uploadPatientDocument,
} from "../lib/api-client";
import { usePatientsQuery } from "../lib/query-hooks";
import { notifyError, notifySuccess } from "../lib/notifications";

type AnyRecord = Record<string, unknown>;

const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const num = (value: unknown): number | null =>
  typeof value === "number" ? value : typeof value === "string" && value.trim() && !Number.isNaN(Number(value)) ? Number(value) : null;

function patientLabel(row: AnyRecord) {
  const name = str(row.name ?? row.fullName) || `${str(row.first_name)} ${str(row.last_name)}`.trim();
  return name || "Unnamed patient";
}

export default function AssistantDocumentsSection() {
  const patientsQuery = usePatientsQuery({ scope: "organization" });
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const patients = useMemo(() => (patientsQuery.data ?? []) as AnyRecord[], [patientsQuery.data]);
  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = patients.filter((row) => {
      if (!term) return true;
      const hay = `${patientLabel(row)} ${str(row.nic)} ${str(row.phone ?? row.mobile)} ${str(row.patient_code ?? row.patientCode)}`.toLowerCase();
      return hay.includes(term);
    });
    return list.slice(0, 40);
  }, [patients, search]);

  const selected = useMemo(
    () => patients.find((row) => num(row.id ?? row.patient_id) === selectedId) ?? null,
    [patients, selectedId]
  );

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-600">Documents</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Upload patient reports</h1>
        <p className="text-sm text-slate-500">Search a patient, then upload their test report (PDF, JPG or PNG).</p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Patient search */}
        <section className="ios-surface flex min-h-0 flex-col rounded-[24px] p-4 md:p-5">
          <div className="mb-3 flex items-center gap-3 rounded-[18px] bg-white px-4 py-2.5 ring-1 ring-slate-200">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, NIC, phone…"
              className="flex-1 bg-transparent text-sm font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none"
            />
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {patientsQuery.isLoading ? (
              <p className="text-sm text-slate-400">Loading patients…</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-slate-400">No patients found.</p>
            ) : (
              <ul className="space-y-1.5">
                {results.map((row) => {
                  const id = num(row.id ?? row.patient_id);
                  const active = id === selectedId;
                  return (
                    <li key={id ?? patientLabel(row)}>
                      <button
                        type="button"
                        onClick={() => id != null && setSelectedId(id)}
                        className={`flex w-full flex-col rounded-2xl px-3.5 py-2.5 text-left transition ${
                          active ? "bg-sky-600 text-white" : "bg-slate-50 text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        <span className="text-sm font-semibold">{patientLabel(row)}</span>
                        <span className={`text-xs ${active ? "text-sky-100" : "text-slate-500"}`}>
                          {str(row.nic, "No NIC")} · {str(row.phone ?? row.mobile, "No phone")}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Upload panel */}
        <section className="ios-surface flex min-h-0 flex-col rounded-[24px] p-4 md:p-5">
          {selected && selectedId != null ? (
            <UploadPanel patientId={selectedId} patientName={patientLabel(selected)} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-slate-400">Select a patient to upload a document.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function UploadPanel({ patientId, patientName }: { patientId: number; patientName: string }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");

  const documents = useQuery({
    queryKey: ["patient-documents", String(patientId)],
    queryFn: () => listPatientDocuments(patientId),
  });

  const upload = useMutation({
    mutationFn: () => uploadPatientDocument(patientId, file as File, note),
    onSuccess: () => {
      notifySuccess("Document uploaded.");
      setFile(null);
      setNote("");
      if (fileRef.current) fileRef.current.value = "";
      void queryClient.invalidateQueries({ queryKey: ["patient-documents", String(patientId)] });
    },
    onError: (error) => notifyError((error as Error)?.message ?? "Upload failed."),
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Uploading for</p>
        <p className="text-lg font-bold text-slate-900">{patientName}</p>
      </div>

      <label className="mb-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 py-6 text-center hover:border-sky-300">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <svg className="mb-1 h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
        </svg>
        <span className="text-sm font-semibold text-slate-700">{file ? file.name : "Choose a file"}</span>
        <span className="text-xs text-slate-400">PDF, JPG or PNG</span>
      </label>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (e.g. Full blood count report)"
        rows={2}
        className="mb-3 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />

      <button
        type="button"
        disabled={!file || upload.isPending}
        onClick={() => upload.mutate()}
        className="mb-4 rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:bg-slate-300"
      >
        {upload.isPending ? "Uploading…" : "Upload document"}
      </button>

      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Uploaded documents</p>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {documents.isLoading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : documents.data && documents.data.length > 0 ? (
          <ul className="space-y-2">
            {(documents.data as AnyRecord[]).map((doc) => {
              const id = num(doc.id)!;
              const uploadedAt = new Date(str(doc.uploadedAt));
              return (
                <li key={id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{str(doc.fileName)}</p>
                    <p className="text-xs text-slate-500">
                      {uploadedAt.toLocaleDateString()} {uploadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {str(doc.source) === "assistant" ? " · Assistant" : str(doc.source) === "patient" ? " · Patient" : ""}
                    </p>
                  </div>
                  <a
                    href={documentRawUrl(id)}
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
          <p className="text-sm text-slate-400">No documents uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
