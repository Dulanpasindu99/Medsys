"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  portalDoctorDirectory,
  portalHome,
  portalLinkDoctor,
  portalMyDoctors,
  portalUnlinkDoctor
} from "@/app/lib/portal-api";
import { usePortalGuard } from "./usePortalAccount";

export default function PortalHomePage() {
  const account = usePortalGuard();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  const homeQuery = useQuery({ queryKey: ["portal", "home"], queryFn: portalHome, enabled: !!account.data?.profileCompleted });
  const doctorsQuery = useQuery({ queryKey: ["portal", "doctors"], queryFn: portalMyDoctors, enabled: !!account.data?.profileCompleted });

  const unlink = useMutation({
    mutationFn: portalUnlinkDoctor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portal", "doctors"] })
  });

  const firstName = account.data?.firstName ?? "there";

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Welcome back</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Hi, {firstName} 👋</h1>
        </div>
      </header>

      {/* My doctors */}
      <section className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-600">My Doctors</h2>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-full bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
          >
            + Add doctor
          </button>
        </div>

        {doctorsQuery.isLoading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : doctorsQuery.data && doctorsQuery.data.length > 0 ? (
          <ul className="space-y-2">
            {doctorsQuery.data.map((doctor) => (
              <li key={doctor.linkId} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{doctor.doctorName}</p>
                  <p className="text-xs text-slate-500">{doctor.clinicName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Sharing
                  </span>
                  <button
                    type="button"
                    onClick={() => unlink.mutate(doctor.linkId)}
                    className="text-xs font-medium text-slate-400 hover:text-rose-500"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">
            Add your doctor to link your records. Your profile will appear on their patient list.
          </p>
        )}
      </section>

      {/* Diagnosis timeline */}
      <section className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 sm:p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Diagnosis Summary</h2>
        {homeQuery.isLoading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : homeQuery.data && homeQuery.data.timeline.length > 0 ? (
          <ol className="relative space-y-4 border-l-2 border-slate-100 pl-4">
            {homeQuery.data.timeline.map((entry) => (
              <li key={entry.encounterId} className="relative">
                <span className="absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-sky-500 shadow" />
                <p className="text-xs font-semibold text-slate-400">
                  {new Date(entry.date).toLocaleDateString()} · {entry.clinicName ?? "Clinic"}
                </p>
                {entry.diagnoses.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {entry.diagnoses.map((diagnosis, index) => (
                      <span key={index} className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                        {diagnosis}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">Visit recorded</p>
                )}
                {entry.notes ? <p className="mt-1 text-xs text-slate-500">{entry.notes}</p> : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-500">No visits yet. Your diagnosis history will appear here.</p>
        )}
      </section>

      {pickerOpen ? <DoctorPicker onClose={() => setPickerOpen(false)} /> : null}
    </div>
  );
}

function DoctorPicker({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const directory = useQuery({ queryKey: ["portal", "directory"], queryFn: portalDoctorDirectory });
  const linked = useQuery({ queryKey: ["portal", "doctors"], queryFn: portalMyDoctors });

  const link = useMutation({
    mutationFn: portalLinkDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "doctors"] });
      queryClient.invalidateQueries({ queryKey: ["portal", "home"] });
    }
  });

  const linkedIds = useMemo(() => new Set((linked.data ?? []).map((d) => d.doctorUserId)), [linked.data]);
  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (directory.data ?? []).filter(
      (d) => !term || d.name.toLowerCase().includes(term) || d.clinicName.toLowerCase().includes(term)
    );
  }, [directory.data, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[80dvh] w-full max-w-md overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h3 className="text-base font-bold text-slate-900">Add a doctor</h3>
          <button type="button" onClick={onClose} className="text-sm text-slate-400">
            Close
          </button>
        </div>
        <div className="p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctor or clinic…"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          <ul className="mt-3 max-h-[52dvh] space-y-2 overflow-y-auto">
            {directory.isLoading ? <li className="text-sm text-slate-400">Loading…</li> : null}
            {results.map((doctor) => {
              const already = linkedIds.has(doctor.doctorUserId);
              return (
                <li key={doctor.doctorUserId} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{doctor.name}</p>
                    <p className="text-xs text-slate-500">{doctor.clinicName}</p>
                  </div>
                  <button
                    type="button"
                    disabled={already || link.isPending}
                    onClick={() => link.mutate(doctor.doctorUserId)}
                    className="rounded-full bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white disabled:bg-slate-300"
                  >
                    {already ? "Added" : "Add"}
                  </button>
                </li>
              );
            })}
            {!directory.isLoading && results.length === 0 ? (
              <li className="text-sm text-slate-400">No doctors found.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
