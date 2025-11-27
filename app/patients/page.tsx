'use client';

import React, { useMemo, useState } from 'react';

type Gender = 'Male' | 'Female';

type Patient = {
  id: string;
  name: string;
  nic: string;
  age: number;
  gender: Gender;
  mobile: string;
  family: string;
  visits: number;
  lastVisit: string;
  nextAppointment?: string;
  tags: string[];
  conditions: string[];
};

const SHADOWS = {
  card: 'shadow-[0_20px_48px_rgba(15,23,42,0.12)]',
  inset: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]',
  chip: 'shadow-[0_10px_24px_rgba(15,23,42,0.08)]',
} as const;

const SectionShell = ({ children }: { children: React.ReactNode }) => (
  <section className={`ios-surface ${SHADOWS.card} p-6 md:p-7`}>{children}</section>
);

const FilterChip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md ${
      active
        ? 'border-sky-200 bg-sky-50 text-sky-800 shadow-[0_12px_26px_rgba(14,165,233,0.22)]'
        : 'border-slate-200/80 bg-white/80 text-slate-700'
    } ${SHADOWS.inset}`}
  >
    {active && <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />} {label}
  </button>
);

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className={`ios-chip bg-white/80 text-[11px] uppercase tracking-[0.18em] text-slate-700 ${SHADOWS.chip}`}>
    {children}
  </span>
);

const patients: Patient[] = [
  {
    id: 'p-01',
    name: 'Ranil Wickramasinghe',
    nic: '74526489V',
    age: 70,
    gender: 'Male',
    mobile: '+94 71 723 4567',
    family: 'Wickramasinghe',
    visits: 22,
    lastVisit: '2 days ago',
    nextAppointment: 'Today 6:30 PM',
    tags: ['Diabetes', 'Hypertension'],
    conditions: ['Sinus Problem', 'Special Notes'],
  },
  {
    id: 'p-02',
    name: 'Chandraka Bandaranayaka',
    nic: '7423665V',
    age: 65,
    gender: 'Female',
    mobile: '+94 71 723 4567',
    family: 'Bandaranayaka',
    visits: 15,
    lastVisit: '1 week ago',
    nextAppointment: 'Today 6:30 PM',
    tags: ['Diabetes', 'Heart Problem', 'Allergy'],
    conditions: ['Medical Notes', 'Special Notes'],
  },
  {
    id: 'p-03',
    name: 'Mahinda Rajapaksha',
    nic: '7423665V',
    age: 66,
    gender: 'Male',
    mobile: '+94 71 723 4567',
    family: 'Rajapaksha',
    visits: 30,
    lastVisit: '3 weeks ago',
    tags: ['Arthritis'],
    conditions: ['Medical Notes', 'Special Notes'],
  },
];

const ageBuckets = [
  { id: 'all', label: 'All Ages' },
  { id: '18-30', label: 'Age 18-30' },
  { id: '31-45', label: 'Age 31-45' },
  { id: '46+', label: 'Age 46+' },
];

const families = ['All Families', 'Wickramasinghe', 'Bandaranayaka', 'Rajapaksha'];

const genderFilters: { id: Gender | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'Male', label: 'Male' },
  { id: 'Female', label: 'Female' },
];

export default function PatientManagement() {
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState<string>('All Families');
  const [ageRange, setAgeRange] = useState<string>('all');
  const [gender, setGender] = useState<Gender | 'all'>('all');

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch = `${patient.name} ${patient.nic} ${patient.mobile} ${patient.family}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFamily = family === 'All Families' || patient.family === family;

      const matchesGender = gender === 'all' || patient.gender === gender;

      const matchesAge =
        ageRange === 'all' ||
        (ageRange === '18-30' && patient.age >= 18 && patient.age <= 30) ||
        (ageRange === '31-45' && patient.age >= 31 && patient.age <= 45) ||
        (ageRange === '46+' && patient.age >= 46);

      return matchesSearch && matchesFamily && matchesGender && matchesAge;
    });
  }, [search, family, ageRange, gender]);

  return (
    <main className="relative isolate min-h-screen px-4 py-6 text-slate-900 sm:px-6 md:px-8">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/60 via-sky-50/80 to-indigo-50" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 30% 18%, rgba(14,165,233,0.18), transparent 38%), radial-gradient(circle at 82% 22%, rgba(56,189,248,0.2), transparent 36%), radial-gradient(circle at 62% 78%, rgba(8,145,178,0.14), transparent 42%)',
        }}
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            <span className="inline-flex h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]" />
            Patient hub
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Patient Management</h1>
              <p className="text-sm text-slate-600">Search, filter, and review patient families in one place.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              <Chip>Patients</Chip>
              <Chip>Families</Chip>
              <Chip>Filters</Chip>
            </div>
          </div>
        </div>

        <SectionShell>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap gap-3">
              <div className={`flex flex-1 items-center gap-3 rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 ${SHADOWS.inset}`}>
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="6" />
                  <path d="M16 16l4 4" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patient by name, NIC, or phone"
                  className="flex-1 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <div className={`flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 ${SHADOWS.inset}`}>
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Family</span>
                <select
                  value={family}
                  onChange={(e) => setFamily(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                >
                  {families.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {genderFilters.map((option) => (
                <FilterChip key={option.id} label={option.label} active={gender === option.id} onClick={() => setGender(option.id)} />
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {ageBuckets.map((bucket) => (
              <FilterChip key={bucket.id} label={bucket.label} active={ageRange === bucket.id} onClick={() => setAgeRange(bucket.id)} />
            ))}
          </div>
        </SectionShell>

        <SectionShell>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Patient records</p>
              <h2 className="text-xl font-bold text-slate-900">{filteredPatients.length} of {patients.length} patients</h2>
            </div>
            <div className="flex gap-2 text-sm font-semibold text-slate-700">
              <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700 ring-1 ring-emerald-100">{patients.length * 8}+ total visits</span>
              <span className="rounded-full bg-sky-50 px-3 py-2 text-sky-700 ring-1 ring-sky-100">Filters ready</span>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {filteredPatients.map((patient) => (
              <article
                key={patient.id}
                className={`overflow-hidden rounded-[26px] border border-white/60 bg-gradient-to-br from-white/95 via-white/90 to-sky-50/80 shadow-[0_16px_42px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 backdrop-blur`}
              >
                <div className="flex flex-col gap-5 px-5 py-5 md:flex-row md:items-start md:justify-between md:px-6 md:py-6">
                  <div className="flex flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.3)]">
                        {patient.id}
                        <span className="text-slate-300">·</span>
                        {patient.name}
                      </div>
                      <span className="text-sm font-semibold text-slate-700">NIC {patient.nic}</span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                        {patient.gender}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-800 ring-1 ring-slate-100">
                        Mobile: {patient.mobile}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-800 ring-1 ring-slate-100">
                        {patient.family} Family
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-800 ring-1 ring-slate-100">
                        Visits: {patient.visits}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-800 ring-1 ring-slate-100">
                        Last visit: {patient.lastVisit}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {patient.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_12px_32px_rgba(15,23,42,0.3)]"
                        >
                          {tag}
                        </span>
                      ))}
                      {patient.nextAppointment ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 ring-1 ring-emerald-100">
                          Next: {patient.nextAppointment}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 rounded-2xl bg-white/90 p-4 ring-1 ring-slate-100 md:w-80">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-100">Family</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-slate-700">
                      <span className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">Age: {patient.age}</span>
                      <span className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">Visits: {patient.visits}</span>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.35)]">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Conditions</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {patient.conditions.map((condition) => (
                          <span key={condition} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 ring-1 ring-white/15">
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button className="ios-button-primary w-full text-center text-sm">View patient profile</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </SectionShell>
      </div>
    </main>
  );
}

