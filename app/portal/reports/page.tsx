"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  portalDocumentDownloadUrl,
  portalDocuments,
  portalMyDoctors,
  portalReceivedDocuments,
  portalUploadDocument
} from "@/app/lib/portal-api";
import { usePortalGuard } from "../usePortalAccount";

// Broad accept so phone camera captures (iPhone HEIC etc.) don't get filtered out.
const ACCEPT = "image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.heic,.heif,.webp";

async function openDocument(id: number) {
  const { url } = await portalDocumentDownloadUrl(id);
  window.open(url, "_blank", "noopener");
}

export default function PortalReportsPage() {
  const account = usePortalGuard();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [doctorUserId, setDoctorUserId] = useState<number | "">("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const doctors = useQuery({ queryKey: ["portal", "doctors"], queryFn: portalMyDoctors, enabled: !!account.data?.profileCompleted });
  const documents = useQuery({ queryKey: ["portal", "documents"], queryFn: portalDocuments, enabled: !!account.data?.profileCompleted });
  const received = useQuery({ queryKey: ["portal", "received"], queryFn: portalReceivedDocuments, enabled: !!account.data?.profileCompleted });

  const upload = useMutation({
    mutationFn: () => portalUploadDocument(Number(doctorUserId), file as File),
    onSuccess: () => {
      setFeedback("Sent to your doctor ✓");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["portal", "documents"] });
    },
    onError: (err) => setFeedback(err instanceof Error ? err.message : "Upload failed")
  });

  const canSend = file && doctorUserId !== "" && !upload.isPending;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">My Reports</h1>
        <p className="text-sm text-slate-500">Send a document or image to one of your doctors.</p>
      </header>

      <section className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 sm:p-5">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Document (PDF, JPG, PNG)</span>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            onChange={(e) => {
              setFeedback(null);
              setFile(e.target.files?.[0] ?? null);
            }}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Send to doctor</span>
          <select
            value={doctorUserId}
            onChange={(e) => setDoctorUserId(e.target.value ? Number(e.target.value) : "")}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          >
            <option value="">Select a doctor…</option>
            {(doctors.data ?? []).map((doctor) => (
              <option key={doctor.linkId} value={doctor.doctorUserId}>
                {doctor.doctorName} — {doctor.clinicName}
              </option>
            ))}
          </select>
          {doctors.data && doctors.data.length === 0 ? (
            <span className="mt-1 block text-xs text-amber-600">Add a doctor on the Home tab first.</span>
          ) : null}
        </label>

        {feedback ? (
          <p className={`mt-3 text-sm font-medium ${feedback.includes("✓") ? "text-emerald-600" : "text-rose-600"}`}>{feedback}</p>
        ) : null}

        <button
          type="button"
          disabled={!canSend}
          onClick={() => {
            setFeedback(null);
            upload.mutate();
          }}
          className="mt-4 w-full rounded-2xl bg-sky-600 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
        >
          {upload.isPending ? "Sending…" : "Send to doctor"}
        </button>
      </section>

      <section className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 sm:p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Sent documents</h2>
        {documents.isLoading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : documents.data && documents.data.length > 0 ? (
          <ul className="space-y-2">
            {documents.data.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{doc.fileName}</p>
                  <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span>{doc.doctorName} · {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    {doc.reviewedAt ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Doctor reviewed</span>
                    ) : null}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openDocument(doc.id)}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100"
                >
                  Open
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Nothing sent yet.</p>
        )}
      </section>

      <section className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 sm:p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Received from your clinic</h2>
        {received.isLoading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : received.data && received.data.length > 0 ? (
          <ul className="space-y-2">
            {received.data.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{doc.fileName}</p>
                  <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span>{doc.clinicName} · {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    {doc.reviewedAt ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Doctor reviewed</span>
                    ) : null}
                  </p>
                  {doc.note ? <p className="mt-0.5 truncate text-xs text-slate-400">“{doc.note}”</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => openDocument(doc.id)}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100"
                >
                  Open
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Reports your clinic shares with you will appear here.</p>
        )}
      </section>
    </div>
  );
}
