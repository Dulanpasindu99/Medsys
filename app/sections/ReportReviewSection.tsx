"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { documentRawUrl, listDocumentReviewQueue } from "../lib/api-client";

type AnyRecord = Record<string, unknown>;
const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const num = (value: unknown): number | null =>
  typeof value === "number" ? value : typeof value === "string" && value.trim() && !Number.isNaN(Number(value)) ? Number(value) : null;

export default function ReportReviewSection() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const queue = useQuery({
    queryKey: ["document-review", "assistant"],
    queryFn: () => listDocumentReviewQueue({ source: "assistant", limit: 100 }),
  });

  const rows = useMemo(() => {
    const list = (queue.data ?? []) as AnyRecord[];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((row) =>
      `${str(row.patientName)} ${str(row.patientNic)} ${str(row.patientPhone)} ${str(row.fileName)} ${str(row.uploadedByName)}`
        .toLowerCase()
        .includes(term)
    );
  }, [queue.data, search]);

  const openInWorkspace = (row: AnyRecord, patientId: number) => {
    // Hand the patient identity off via sessionStorage (not the URL) so the doctor
    // workspace can pre-fill it without leaking PHI into browser history.
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        "medlink:reviewPatient",
        JSON.stringify({
          patientId,
          name: str(row.patientName, "Patient"),
          patientCode: str(row.patientCode) || null,
          nic: str(row.patientNic) || null,
          phone: str(row.patientPhone) || null,
          age: num(row.patientAge),
          dateOfBirth: str(row.patientDob) || null,
          gender: str(row.patientGender) || null,
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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Reports awaiting review</h1>
          <p className="text-sm text-slate-500">Test reports uploaded by assistants. Open a report, or open the patient in your workspace.</p>
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

      <section className="ios-surface min-h-0 flex-1 overflow-y-auto rounded-[24px] p-4 md:p-5">
        {queue.isLoading ? (
          <p className="text-sm text-slate-400">Loading reports…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-400">No reports to review.</p>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((row) => {
              const id = num(row.id)!;
              const patientId = num(row.patientId);
              const uploadedAt = new Date(str(row.uploadedAt));
              return (
                <li
                  key={id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{str(row.patientName, "Unknown patient")}</p>
                      {str(row.patientCode) ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{str(row.patientCode)}</span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      NIC {str(row.patientNic, "—")} · {str(row.patientPhone, "—")}
                      {num(row.patientAge) != null ? ` · Age ${num(row.patientAge)}` : ""}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">{str(row.fileName)}</span> · {uploadedAt.toLocaleDateString()}{" "}
                      {uploadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {str(row.uploadedByName) ? ` · by ${str(row.uploadedByName)}` : ""}
                    </p>
                    {str(row.note) ? <p className="mt-0.5 truncate text-xs text-slate-400">“{str(row.note)}”</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={documentRawUrl(id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-sky-50 px-3.5 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100 hover:bg-sky-100"
                    >
                      Open report
                    </a>
                    {patientId != null ? (
                      <button
                        type="button"
                        onClick={() => openInWorkspace(row, patientId)}
                        className="rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Open in workspace
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
