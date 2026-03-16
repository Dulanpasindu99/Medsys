import Image from "next/image";
import Link from "next/link";
import type { PatientGender } from "../types";

type DoctorHeaderProps = {
  patientCode: string;
  onPatientCodeChange: (value: string) => void;
  onPatientCodeCommit: () => void;
  nicNumber: string;
  onNicNumberChange: (value: string) => void;
  onNicLookupCommit: () => void;
  gender: PatientGender;
  onGenderChange: (value: PatientGender) => void;
  patientName: string;
  onPatientNameChange: (value: string) => void;
  patientAge: string;
  onPatientAgeChange: (value: string) => void;
  lookupNotice?: string | null;
  lookupActionHref?: string | null;
};

export function DoctorHeader({
  patientCode,
  onPatientCodeChange,
  onPatientCodeCommit,
  nicNumber,
  onNicNumberChange,
  onNicLookupCommit,
  gender,
  onGenderChange,
  patientName,
  onPatientNameChange,
  patientAge,
  onPatientAgeChange,
  lookupNotice = null,
  lookupActionHref = null,
}: DoctorHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="w-52 rounded-[999px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          placeholder="Patient code"
          value={patientCode}
          onChange={(event) => onPatientCodeChange(event.target.value)}
          onBlur={onPatientCodeCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onPatientCodeCommit();
            }
          }}
        />

        <input
          className="w-52 rounded-[999px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          placeholder="NIC / guardian NIC"
          value={nicNumber}
          onChange={(event) => onNicNumberChange(event.target.value)}
          onBlur={onNicLookupCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onNicLookupCommit();
            }
          }}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onGenderChange("Male")}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              gender === "Male"
                ? "bg-slate-800 text-white shadow-md"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Male
          </button>
          <button
            type="button"
            onClick={() => onGenderChange("Female")}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              gender === "Female"
                ? "bg-rose-600 text-white shadow-md"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-rose-50"
            }`}
          >
            Female
          </button>
        </div>

        <div className="flex-1" />
        <Image
          src="/assets/brand-logo.png"
          alt="Brand Logo"
          width={160}
          height={40}
          className="h-10 w-auto object-contain opacity-90"
        />
      </div>

      {lookupNotice ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          <span>{lookupNotice}</span>
          {lookupActionHref ? (
            <Link
              href={lookupActionHref}
              className="rounded-full bg-[var(--ioc-blue)] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(10,132,255,0.25)] transition hover:bg-[#0070f0]"
            >
              Open Assistant Panel
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <input
          className="flex-1 rounded-xl border border-transparent bg-slate-50/50 px-4 py-2 text-lg font-bold text-slate-900 placeholder-slate-300 outline-none ring-1 ring-slate-200/50 transition focus:bg-white focus:ring-2 focus:ring-sky-100"
          placeholder="Patient Name"
          value={patientName}
          onChange={(e) => onPatientNameChange(e.target.value)}
        />
        <input
          className="w-20 rounded-xl border border-transparent bg-slate-50/50 px-3 py-2 text-center text-lg font-bold text-slate-900 placeholder-slate-300 outline-none ring-1 ring-slate-200/50 transition focus:bg-white focus:ring-2 focus:ring-sky-100"
          placeholder="Age"
          value={patientAge}
          onChange={(e) => onPatientAgeChange(e.target.value)}
        />
        <div className="pl-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          Patient No: <span className="text-slate-900">{patientCode || "--"}</span>
        </div>
      </div>
    </div>
  );
}
