"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentRawUrl, listDocumentReviewQueue, markDocumentReviewed } from "../lib/api-client";
import { notifyError } from "../lib/notifications";

type AnyRecord = Record<string, unknown>;
const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const num = (value: unknown): number | null =>
  typeof value === "number" ? value : typeof value === "string" && value.trim() && !Number.isNaN(Number(value)) ? Number(value) : null;

type PatientGroup = {
  patientId: number;
  patientName: string;
  patientCode: string;
  patientNic: string;
  patientPhone: string;
  patientAge: number | null;
  patientDob: string | null;
  patientGender: string | null;
  docs: AnyRecord[];
};

export default function ReportReviewSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showPast, setShowPast] = useState(false);

  const queue = useQuery({
    queryKey: ["document-review", showPast ? "past" : "pending"],
    queryFn: () => listDocumentReviewQueue({ reviewed: showPast, limit: 200 }),
  });

  const review = useMutation({
    mutationFn: (id: number) => markDocumentReviewed(id, true),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["document-review"] });
    },
    onError: (error) => notifyError((error as Error)?.message ?? "Could not mark reviewed."),
  });

  const groups = useMemo<PatientGroup[]>(() => {
    const rows = (queue.data ?? []) as AnyRecord[];
    const term = search.trim().toLowerCase();
    const byPatient = new Map<number, PatientGroup>();
    for (const row of rows) {
      const patientId = num(row.patientId);
      if (patientId == null) continue;
      if (
        term &&
        !`${str(row.patientName)} ${str(row.patientNic)} ${str(row.patientPhone)} ${str(row.fileName)} ${str(row.uploadedByName)}`
          .toLowerCase()
          .includes(term)
      ) {
        continue;
      }
      let group = byPatient.get(patientId);
      if (!group) {
        group = {
          patientId,
          patientName: str(row.patientName, "Unknown patient"),
          patientCode: str(row.patientCode),
          patientNic: str(row.patientNic),
          patientPhone: str(row.patientPhone),
          patientAge: num(row.patientAge),
          patientDob: str(row.patientDob) || null,
          patientGender: str(row.patientGender) || null,
          docs: [],
        };
        byPatient.set(patientId, group);
      }
      group.docs.push(row);
    }
    return [...byPatient.values()];
  }, [queue.data, search]);

  const openInWorkspace = (group: PatientGroup) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        "medlink:reviewPatient",
        JSON.stringify({
          patientId: group.patientId,
          name: group.patientName,
          patientCode: group.patientCode || null,
          nic: group.patientNic || null,
          phone: group.patientPhone || null,
          age: group.patientAge,
          dateOfBirth: group.patientDob,
          gender: group.patientGender,
        })
      );
    }
    router.push(`/doctor?tab=documents`);
  };

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-600">Report Review</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {showPast ? "Reviewed reports" : "Reports awaiting review"}
          </h1>
          <p className="text-sm text-slate-500">
            Reports uploaded by assistants and by patients. Open a report, or open the patient in your workspace.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-2.5 ring-1 ring-slate-200 sm:w-72">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, NIC, file…"
            className="flex-1 bg-transparent text-sm font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none"
          />
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </header>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowPast(false)}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${!showPast ? "bg-sky-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
        >
          Awaiting review
        </button>
        <button
          type="button"
          onClick={() => setShowPast(true)}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${showPast ? "bg-sky-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
        >
          See past reports
        </button>
      </div>

      <section className="ios-surface min-h-0 flex-1 overflow-y-auto rounded-[24px] p-4 md:p-5">
        {queue.isLoading ? (
          <p className="text-sm text-slate-400">Loading reports…</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-slate-400">{showPast ? "No reviewed reports yet." : "No reports to review."}</p>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li key={group.patientId} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{group.patientName}</p>
                      {group.patientCode ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{group.patientCode}</span>
                      ) : null}
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                        {group.docs.length} {group.docs.length === 1 ? "report" : "reports"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      NIC {group.patientNic || "—"} · {group.patientPhone || "—"}
                      {group.patientAge != null ? ` · Age ${group.patientAge}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openInWorkspace(group)}
                    className="shrink-0 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Open in workspace
                  </button>
                </div>

                <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  {group.docs.map((doc) => {
                    const id = num(doc.id)!;
                    const uploadedAt = new Date(str(doc.uploadedAt));
                    const source = str(doc.source);
                    return (
                      <li key={id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            <span className="mr-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              {source === "patient" ? "Patient" : "Assistant"}
                            </span>
                            {str(doc.fileName)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {uploadedAt.toLocaleDateString()} {uploadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {str(doc.uploadedByName) ? ` · by ${str(doc.uploadedByName)}` : ""}
                            {showPast && str(doc.reviewedByName) ? ` · reviewed by ${str(doc.reviewedByName)}` : ""}
                          </p>
                          {str(doc.note) ? <p className="mt-0.5 truncate text-xs text-slate-400">“{str(doc.note)}”</p> : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {!showPast ? (
                            <button
                              type="button"
                              disabled={review.isPending}
                              onClick={() => review.mutate(id)}
                              className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100 disabled:opacity-50"
                            >
                              Mark reviewed
                            </button>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Reviewed</span>
                          )}
                          <a
                            href={documentRawUrl(id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100 hover:bg-sky-100"
                          >
                            Open
                          </a>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
