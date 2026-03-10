import Image from "next/image";
import type { PatientGender } from "../types";

type DoctorHeaderProps = {
  nicNumber: string;
  onNicNumberChange: (value: string) => void;
  gender: PatientGender;
  onGenderChange: (value: PatientGender) => void;
  patientName: string;
  onPatientNameChange: (value: string) => void;
  patientAge: string;
  onPatientAgeChange: (value: string) => void;
};

export function DoctorHeader({
  nicNumber,
  onNicNumberChange,
  gender,
  onGenderChange,
  patientName,
  onPatientNameChange,
  patientAge,
  onPatientAgeChange,
}: DoctorHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="w-52 rounded-[999px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          placeholder="Enter NIC No"
          value={nicNumber}
          onChange={(event) => onNicNumberChange(event.target.value)}
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
        <Image src="/assets/brand-logo.png" alt="Brand Logo" width={160} height={40} className="h-10 w-auto object-contain opacity-90" />
      </div>

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
          Patient No: <span className="text-slate-900">12</span>
        </div>
      </div>
    </div>
  );
}
