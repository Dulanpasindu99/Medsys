import Image from "next/image";
import type { Patient } from "../types";
import type { PatientGender } from "../types";

type DoctorHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchCommit: () => void;
  searchMatches: Patient[];
  onSearchSelect: (patient: Patient) => void;
  patientCode: string;
  nicNumber: string;
  gender: PatientGender;
  onGenderChange: (value: PatientGender) => void;
  patientName: string;
  onPatientNameChange: (value: string) => void;
  patientAge: string;
  onPatientAgeChange: (value: string) => void;
  nicIdentityLabel?: "Patient NIC" | "Guardian NIC" | null;
};

export function DoctorHeader({
  search,
  onSearchChange,
  onSearchCommit,
  searchMatches,
  onSearchSelect,
  patientCode,
  nicNumber,
  gender,
  onGenderChange,
  patientName,
  onPatientNameChange,
  patientAge,
  onPatientAgeChange,
  nicIdentityLabel = null,
}: DoctorHeaderProps) {
  return (
    <div className="grid p-4 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[auto_auto_auto] lg:items-start lg:gap-x-4">
      <div className="relative min-w-0 md:max-w-[32rem] xl:max-w-[36rem] lg:col-start-1 lg:row-start-1">
        <input
          className="w-full rounded-[999px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          placeholder="Search by name, patient code, NIC, or guardian"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onBlur={onSearchCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSearchCommit();
            }
          }}
        />
        {search.trim() && searchMatches.length > 0 ? (
          <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-60 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
            {searchMatches.map((patient) => (
              <button
                key={`${patient.patientId ?? "unknown"}-${patient.appointmentId ?? patient.nic}`}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSearchSelect(patient);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-slate-800 transition hover:bg-sky-50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {patient.name}
                  </div>
                  <div className="truncate text-[11px] text-slate-500">
                    {patient.patientCode || patient.nic}
                    {patient.guardianNic
                      ? ` | Guardian ${patient.guardianNic}`
                      : ""}
                  </div>
                </div>
                <span className="ml-3 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-100">
                  {patient.time}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex justify-start lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:min-w-[15rem] lg:justify-end">
        <Image
          src="/assets/brand-logo.png"
          alt="Brand Logo"
          width={160}
          height={40}
          className="h-10 w-auto object-contain opacity-90"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] md:items-center xl:grid-cols-[36rem_minmax(0,1fr)] lg:col-start-1 lg:row-start-2">
        <div className="relative min-w-0">
          <input
            className="w-full rounded-[999px] border border-slate-200 bg-white px-4 py-2.5 pr-24 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none"
            placeholder="NIC / guardian NIC"
            value={nicNumber}
            readOnly
          />
          {nicIdentityLabel ? (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-sky-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700 ring-1 ring-sky-100">
              {nicIdentityLabel}
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex flex-nowrap items-center gap-2">
            <button
              type="button"
              onClick={() => onGenderChange("Male")}
              className={`app-segment app-segment--male ${gender === "Male" ? "is-active" : ""}`}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => onGenderChange("Female")}
              className={`app-segment app-segment--female ${gender === "Female" ? "is-active" : ""}`}
            >
              Female
            </button>
          </div>
          <div className="ml-auto shrink-0 whitespace-nowrap pl-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Patient No:{" "}
            <span className="text-slate-900">{patientCode || "--"}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:col-span-2 lg:row-start-3">
        <input
          className="flex-1 rounded-xl border border-transparent bg-slate-50/50 px-4 py-2 text-lg font-bold text-slate-900 placeholder-slate-300 outline-none ring-1 ring-slate-200/50 transition focus:bg-white focus:ring-2 focus:ring-sky-100"
          placeholder="Patient Name"
          value={patientName}
          onChange={(e) => onPatientNameChange(e.target.value)}
        />
        <input
          className="w-20 rounded-xl border border-transparent bg-slate-50/50 px-3 py-3 text-center text-lg font-bold text-slate-900 placeholder-slate-300 outline-none ring-1 ring-slate-200/50 transition focus:bg-white focus:ring-2 focus:ring-sky-100"
          placeholder="Age"
          value={patientAge}
          onChange={(e) => onPatientAgeChange(e.target.value)}
        />
      </div>
    </div>
  );
}
