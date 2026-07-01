"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { portalEncounter, portalHistory } from "@/app/lib/portal-api";
import { usePortalGuard } from "../usePortalAccount";

export default function PortalHistoryPage() {
  const account = usePortalGuard();
  const [openId, setOpenId] = useState<number | null>(null);

  const history = useQuery({
    queryKey: ["portal", "history"],
    queryFn: portalHistory,
    enabled: !!account.data?.profileCompleted
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">My History</h1>
        <p className="text-sm text-slate-500">Your prescriptions from every linked clinic.</p>
      </header>

      {history.isLoading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : history.data && history.data.length > 0 ? (
        <ul className="space-y-3">
          {history.data.map((card) => (
            <li key={card.prescriptionId}>
              <button
                type="button"
                onClick={() => setOpenId(card.encounterId)}
                className="w-full rounded-[22px] border border-white/80 bg-white/95 p-4 text-left shadow-[0_12px_32px_rgba(15,23,42,0.07)] ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(2,132,199,0.14)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">{new Date(card.date).toLocaleDateString()}</span>
                  <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
                    {card.drugCount} {card.drugCount === 1 ? "medicine" : "medicines"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-800">{card.clinicName ?? "Clinic"}</p>
                <p className="text-xs text-slate-500">{card.doctorName ?? ""}</p>
                {card.drugPreview.length > 0 ? (
                  <p className="mt-2 line-clamp-1 text-xs text-slate-500">{card.drugPreview.join(" · ")}</p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No prescriptions yet.</p>
      )}

      {openId != null ? <EncounterDetail encounterId={openId} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}

function EncounterDetail({ encounterId, onClose }: { encounterId: number; onClose: () => void }) {
  const detail = useQuery({
    queryKey: ["portal", "encounter", encounterId],
    queryFn: () => portalEncounter(encounterId)
  });

  const data = detail.data as
    | {
        encounter?: { checkedAt?: string; notes?: string | null; priceLkr?: string | null; nextVisitDate?: string | null };
        clinicName?: string | null;
        doctorName?: string | null;
        diagnoses?: Array<{ diagnosisName: string }>;
        tests?: Array<{ testName: string }>;
        prescriptionItems?: Array<{ drugName: string; dose: string; frequency: string; duration: string | null }>;
      }
    | undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Consultation details</h3>
          <button type="button" onClick={onClose} className="text-sm text-slate-400">
            Close
          </button>
        </div>

        {detail.isLoading || !data ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 px-3.5 py-3 text-sm">
              <p className="font-semibold text-slate-800">{data.clinicName ?? "Clinic"}</p>
              <p className="text-xs text-slate-500">
                {data.doctorName ?? ""} · {data.encounter?.checkedAt ? new Date(data.encounter.checkedAt).toLocaleDateString() : ""}
              </p>
            </div>

            {data.diagnoses && data.diagnoses.length > 0 ? (
              <Block title="Diagnoses">
                <div className="flex flex-wrap gap-1.5">
                  {data.diagnoses.map((d, i) => (
                    <span key={i} className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                      {d.diagnosisName}
                    </span>
                  ))}
                </div>
              </Block>
            ) : null}

            {data.prescriptionItems && data.prescriptionItems.length > 0 ? (
              <Block title="Prescription">
                <ul className="space-y-1.5">
                  {data.prescriptionItems.map((item, i) => (
                    <li key={i} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-medium text-slate-800">{item.drugName}</span>
                      <span className="text-xs text-slate-500">
                        {" "}
                        · {item.dose} · {item.frequency}
                        {item.duration ? ` · ${item.duration}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </Block>
            ) : null}

            {data.tests && data.tests.length > 0 ? (
              <Block title="Tests ordered">
                <div className="flex flex-wrap gap-1.5">
                  {data.tests.map((t, i) => (
                    <span key={i} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {t.testName}
                    </span>
                  ))}
                </div>
              </Block>
            ) : null}

            {data.encounter?.notes ? (
              <Block title="Doctor's notes">
                <p className="whitespace-pre-line text-sm text-slate-600">{data.encounter.notes}</p>
              </Block>
            ) : null}

            {data.encounter?.nextVisitDate ? (
              <p className="text-sm text-slate-500">
                Next visit: <span className="font-medium text-slate-700">{data.encounter.nextVisitDate}</span>
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      {children}
    </div>
  );
}
