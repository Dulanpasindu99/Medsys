"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  portalDoctorDirectory,
  portalDocumentDownloadUrl,
  portalGetFamily,
  portalHome,
  portalLinkDoctor,
  portalMyDoctors,
  portalProfileSummary,
  portalUnlinkDoctor,
  type PortalFamilyMember,
  type PortalLinkedDoctor,
} from "@/app/lib/portal-api";
import { usePortalGuard } from "./usePortalAccount";

type Profile = { memberId: number | null; name: string; relationship: string };

export default function PortalHomePage() {
  const account = usePortalGuard();
  const queryClient = useQueryClient();
  const [picker, setPicker] = useState<Profile | null>(null);
  const [selected, setSelected] = useState<Profile | null>(null);

  const enabled = !!account.data?.profileCompleted;
  const homeQuery = useQuery({ queryKey: ["portal", "home"], queryFn: portalHome, enabled });
  const doctorsQuery = useQuery({ queryKey: ["portal", "doctors"], queryFn: portalMyDoctors, enabled });
  const familyQuery = useQuery({ queryKey: ["portal", "family"], queryFn: portalGetFamily, enabled });

  const unlink = useMutation({
    mutationFn: portalUnlinkDoctor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portal", "doctors"] }),
  });

  const firstName = account.data?.firstName ?? "there";

  // Profiles = the account holder ("You") + every family member, for the grid + picker.
  const profiles: Profile[] = useMemo(() => {
    const you: Profile = {
      memberId: null,
      name: `${account.data?.firstName ?? ""} ${account.data?.lastName ?? ""}`.trim() || "You",
      relationship: "you",
    };
    const members = (familyQuery.data?.members ?? []).map((m: PortalFamilyMember) => ({
      memberId: m.id,
      name: `${m.firstName} ${m.lastName}`.trim(),
      relationship: m.relationship,
    }));
    return [you, ...members];
  }, [account.data, familyQuery.data]);

  const doctorsFor = (p: Profile) => (doctorsQuery.data ?? []).filter((d) => (d.memberId ?? null) === p.memberId);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-slate-500">Welcome back</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Hi, {firstName} 👋</h1>
      </header>

      {/* Family grid */}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-600">My Family</h2>
        <div className="grid grid-cols-2 gap-3">
          {profiles.map((p) => {
            const isYou = p.memberId === null;
            const count = doctorsFor(p).length;
            return (
              <button
                key={p.memberId ?? "you"}
                type="button"
                onClick={() => setSelected(p)}
                className={`flex flex-col items-start gap-1 rounded-[22px] border p-4 text-left shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 ${
                  isYou ? "border-sky-200 bg-sky-50" : "border-white/80 bg-white/95 ring-1 ring-slate-100"
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-sm font-bold uppercase text-white">
                  {(p.name[0] ?? "?").toUpperCase()}
                </span>
                <span className="mt-1 truncate text-sm font-bold text-slate-900">{p.name}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {isYou ? "You" : p.relationship}
                </span>
                <span className="text-[11px] text-slate-500">{count} doctor{count === 1 ? "" : "s"}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* My doctors — grouped by profile */}
      <section className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 sm:p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-600">My Doctors</h2>
        {doctorsQuery.isLoading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          <div className="space-y-4">
            {profiles.map((p) => {
              const docs = doctorsFor(p);
              return (
                <div key={p.memberId ?? "you"}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700">
                      {p.name} <span className="font-medium text-slate-400">· {p.relationship === "you" ? "You" : p.relationship}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setPicker(p)}
                      className="rounded-full bg-sky-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-sky-700"
                    >
                      + Add doctor
                    </button>
                  </div>
                  {docs.length > 0 ? (
                    <ul className="space-y-2">
                      {docs.map((doctor) => (
                        <li key={doctor.linkId} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {doctor.doctorName}
                              {doctor.label ? (
                                <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">{doctor.label}</span>
                              ) : null}
                            </p>
                            <p className="text-xs text-slate-500">{doctor.clinicName}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => unlink.mutate(doctor.linkId)}
                            className="text-xs font-medium text-slate-400 hover:text-rose-500"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400">No doctors linked yet.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Diagnosis timeline */}
      <section className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 sm:p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Diagnosis Summary (whole family)</h2>
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
          <p className="text-sm text-slate-500">No visits yet. Your family&apos;s diagnosis history will appear here.</p>
        )}
      </section>

      {selected ? <ProfileSheet profile={selected} doctors={doctorsFor(selected)} onClose={() => setSelected(null)} onAddDoctor={() => { setPicker(selected); setSelected(null); }} /> : null}
      {picker ? <DoctorPicker profile={picker} onClose={() => setPicker(null)} /> : null}
    </div>
  );
}

async function openDoc(id: number) {
  const { url } = await portalDocumentDownloadUrl(id);
  window.open(url, "_blank", "noopener");
}

function ProfileSheet({ profile, doctors, onClose, onAddDoctor }: { profile: Profile; doctors: PortalLinkedDoctor[]; onClose: () => void; onAddDoctor: () => void }) {
  const summary = useQuery({
    queryKey: ["portal", "profile", profile.memberId ?? "self"],
    queryFn: () => portalProfileSummary(profile.memberId),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[86dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">{profile.name}</h3>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{profile.relationship === "you" ? "You" : profile.relationship}</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-slate-400">Close</button>
        </div>

        {/* Doctors */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Doctors</p>
          <button type="button" onClick={onAddDoctor} className="rounded-full bg-sky-600 px-3 py-1 text-[11px] font-semibold text-white">+ Add</button>
        </div>
        {doctors.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {doctors.map((d) => (
              <li key={d.linkId} className="rounded-2xl bg-slate-50 px-3.5 py-2.5">
                <p className="text-sm font-semibold text-slate-800">{d.doctorName}{d.label ? <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">{d.label}</span> : null}</p>
                <p className="text-xs text-slate-500">{d.clinicName}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No doctors linked to this profile yet.</p>
        )}

        {/* Diagnoses */}
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Diagnoses</p>
        {summary.isLoading ? (
          <p className="mt-2 text-sm text-slate-400">Loading…</p>
        ) : summary.data && summary.data.timeline.length > 0 ? (
          <ol className="relative mt-2 space-y-3 border-l-2 border-slate-100 pl-4">
            {summary.data.timeline.map((entry) => (
              <li key={entry.encounterId} className="relative">
                <span className="absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-sky-500 shadow" />
                <p className="text-xs font-semibold text-slate-400">
                  {new Date(entry.date).toLocaleDateString()} · {entry.clinicName ?? "Clinic"}
                </p>
                {entry.diagnoses.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {entry.diagnoses.map((diagnosis, index) => (
                      <span key={index} className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">{diagnosis}</span>
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
          <p className="mt-2 text-sm text-slate-500">No diagnoses recorded for this profile.</p>
        )}

        {/* Documents sent */}
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Documents sent</p>
        {summary.data && summary.data.sentDocuments.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {summary.data.sentDocuments.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{doc.fileName}</p>
                  <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span>{doc.doctorName} · {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    {doc.reviewedAt ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Reviewed</span> : null}
                  </p>
                </div>
                <button type="button" onClick={() => openDoc(doc.id)} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">Open</button>
              </li>
            ))}
          </ul>
        ) : summary.isLoading ? null : (
          <p className="mt-2 text-sm text-slate-500">Nothing sent for this profile yet.</p>
        )}

        {/* Documents received */}
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Documents received</p>
        {summary.data && summary.data.receivedDocuments.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {summary.data.receivedDocuments.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{doc.fileName}</p>
                  <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span>{doc.clinicName} · {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    {doc.reviewedAt ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Reviewed</span> : null}
                  </p>
                  {doc.note ? <p className="mt-0.5 truncate text-xs text-slate-400">“{doc.note}”</p> : null}
                </div>
                <button type="button" onClick={() => openDoc(doc.id)} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">Open</button>
              </li>
            ))}
          </ul>
        ) : summary.isLoading ? null : (
          <p className="mt-2 text-sm text-slate-500">Nothing received for this profile yet.</p>
        )}
      </div>
    </div>
  );
}

function DoctorPicker({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [label, setLabel] = useState("");
  const directory = useQuery({ queryKey: ["portal", "directory"], queryFn: portalDoctorDirectory });
  const linked = useQuery({ queryKey: ["portal", "doctors"], queryFn: portalMyDoctors });

  const link = useMutation({
    mutationFn: (doctorUserId: number) => portalLinkDoctor({ doctorUserId, memberId: profile.memberId, label: label.trim() || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "doctors"] });
      queryClient.invalidateQueries({ queryKey: ["portal", "home"] });
    },
  });

  // Already-linked doctors for THIS profile (a doctor can be linked to multiple profiles).
  const linkedIds = useMemo(
    () => new Set((linked.data ?? []).filter((d) => (d.memberId ?? null) === profile.memberId).map((d) => d.doctorUserId)),
    [linked.data, profile.memberId]
  );
  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (directory.data ?? []).filter((d) => !term || d.name.toLowerCase().includes(term) || d.clinicName.toLowerCase().includes(term));
  }, [directory.data, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[85dvh] w-full max-w-md overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h3 className="text-base font-bold text-slate-900">Add a doctor for {profile.name}</h3>
          <button type="button" onClick={onClose} className="text-sm text-slate-400">Close</button>
        </div>
        <div className="p-4">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Tag (optional) — e.g. Family doctor, Dental"
            className="mb-2 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctor or clinic…"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          <ul className="mt-3 max-h-[48dvh] space-y-2 overflow-y-auto">
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
            {!directory.isLoading && results.length === 0 ? <li className="text-sm text-slate-400">No doctors found.</li> : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
