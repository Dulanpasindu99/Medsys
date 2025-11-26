'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

type IconRenderer = (props: React.SVGProps<SVGSVGElement>) => JSX.Element;

const DoctorIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <circle cx={12} cy={7} r={3.5} />
    <path d="M6 20c.6-3.2 3.1-5.5 6-5.5s5.4 2.3 6 5.5" />
    <path d="M9 14h6" />
  </svg>
);

const AssistantIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M4 10.5l2.2-4.5h11.6l2.2 4.5" />
    <path d="M6.5 10.5v4.8a5.5 5.5 0 0011 0v-4.8" />
    <path d="M12 9v2.3M10.7 10.2h2.6" />
  </svg>
);

const PatientsIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M6 7h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
    <path d="M9 4h6l1 3H8l1-3z" />
    <path d="M9 13h6M9 17h4" />
  </svg>
);

const StatsIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M5 20h14" />
    <path d="M8 16V9" />
    <path d="M12 16V6" />
    <path d="M16 16v-4" />
  </svg>
);

const InventoryIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M3 7l9-4 9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
    <path d="M12 11v10" />
  </svg>
);

const ChatIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M6 6h12a3 3 0 013 3v5a3 3 0 01-3 3h-2.5L12 20.5 10.5 17H6a3 3 0 01-3-3V9a3 3 0 013-3z" />
    <path d="M9 11h6M9 14h4" />
  </svg>
);

const LogoutIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M15 7l5 5-5 5" />
    <path d="M10 12h10" />
    <path d="M4 5v14" />
  </svg>
);

const SHADOWS = {
  card: 'shadow-[0_18px_42px_rgba(28,63,99,0.08)]',
  tooltip: 'shadow-[0_12px_24px_rgba(0,114,206,0.22)]',
};

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className={`rounded-3xl border border-slate-100 bg-white/90 p-5 backdrop-blur ${SHADOWS.card}`}>
    {children}
  </div>
);

interface Prescription {
  id: string;
  patient: string;
  nic: string;
  age: number;
  gender: 'Male' | 'Female';
  diagnosis: string;
  clinical: { name: string; dose: string; terms: string; amount: number }[];
  outside: { name: string; dose: string; terms: string; amount: number }[];
  allergies: string[];
}

export default function AssistantScreen() {
  const [pendingPatients, setPendingPatients] = useState<Prescription[]>([
    {
      id: 'MH0001',
      patient: 'Ranil Wickramasinghe',
      nic: '156546658V',
      age: 70,
      gender: 'Male',
      diagnosis: 'Fever, head ache',
      clinical: [
        { name: 'Cough Syrup', dose: '20ml', terms: '3 x 4', amount: 1 },
        { name: 'Cough Strops', dose: '1', terms: '4', amount: 7 },
      ],
      outside: [
        { name: 'Zink', dose: '2', terms: '3 x 4', amount: 24 },
        { name: 'Paracetamol', dose: '500mg', terms: '2 x 4', amount: 16 },
      ],
      allergies: ['Penicillin', 'Piriton'],
    },
    {
      id: 'MH0002',
      patient: 'Chathura Deshan',
      nic: '865637762V',
      age: 32,
      gender: 'Male',
      diagnosis: 'Flu',
      clinical: [{ name: 'Napa', dose: '500mg', terms: '2 x 5', amount: 10 }],
      outside: [{ name: 'Vitamin C', dose: '500mg', terms: 'Daily', amount: 7 }],
      allergies: ['—'],
    },
  ]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activePrescription = pendingPatients[activeIndex];

  const [formState, setFormState] = useState({
    nic: '',
    name: '',
    mobile: '',
    age: '',
    allergyInput: '',
    allergies: ['No allergies'],
    bloodGroup: 'O+',
    priority: 'Normal' as 'Normal' | 'Urgent' | 'Critical',
    regularDrug: '',
  });

  const [completedSearch, setCompletedSearch] = useState('');

  const stats = useMemo(
    () => ({ total: 101, male: 20, female: 81, existing: 79, new: 22 }),
    []
  );

  const availableDoctors = useMemo(
    () => [
      { name: 'Dr. Malith', status: 'Online' },
      { name: 'Dr. Jay', status: 'Online' },
      { name: 'Dr. Naveen', status: 'Offline' },
    ],
    []
  );

  const completed = useMemo(
    () => [
      { name: 'Rani Fernando', age: 34, nic: '856456456V', time: '5.45 PM' },
      { name: 'Sathya Dev', age: 65, nic: '222343222V', time: '5.25 PM' },
      { name: 'Chathura Deshan', age: 32, nic: '865637762V', time: '5.00 PM' },
      { name: 'Rathmalie De Silva', age: 42, nic: '650002343V', time: '4.15 PM' },
    ],
    []
  );

  const filteredCompleted = completed.filter((entry) =>
    `${entry.name} ${entry.nic}`.toLowerCase().includes(completedSearch.toLowerCase())
  );

  const addPatient = () => {
    if (!formState.nic || !formState.name || !formState.age) return;
    const next: Prescription = {
      id: `MH${(pendingPatients.length + 1).toString().padStart(4, '0')}`,
      patient: formState.name,
      nic: formState.nic,
      age: Number(formState.age),
      gender: 'Male',
      diagnosis: 'Awaiting doctor',
      clinical: [],
      outside: [],
      allergies: formState.allergies,
    };
    setPendingPatients((prev) => [...prev, next]);
    setFormState((prev) => ({
      ...prev,
      nic: '',
      name: '',
      mobile: '',
      age: '',
      allergyInput: '',
      allergies: ['No allergies'],
      regularDrug: '',
      priority: 'Normal',
    }));
  };

  const addAllergy = () => {
    const entry = formState.allergyInput.trim();
    if (!entry) return;
    setFormState((prev) => ({
      ...prev,
      allergies: Array.from(new Set([...prev.allergies.filter((v) => v !== 'No allergies'), entry])),
      allergyInput: '',
    }));
  };

  const markDoneAndNext = () => {
    if (!pendingPatients.length) return;
    const nextIndex = (activeIndex + 1) % pendingPatients.length;
    setActiveIndex(nextIndex);
  };

  const navigationItems = useMemo(
    () => [
      { id: 'doctor', label: 'Doctor Screen', icon: DoctorIcon, href: '/' },
      { id: 'assistant', label: 'Assistant Screen', icon: AssistantIcon, href: '/assistant' },
      { id: 'patient', label: 'Patiant Management', icon: PatientsIcon, href: '/patients' },
      { id: 'stats', label: 'Stats', icon: StatsIcon, href: '/stats' },
      { id: 'inventory', label: 'Inventry Management', icon: InventoryIcon, href: '/inventory' },
      { id: 'ai', label: 'Ai Chat', icon: ChatIcon, href: '/ai' },
    ],
    []
  );

  const activeNavigationId = 'assistant';
  const logoutItem = useMemo(() => ({ id: 'logout', label: 'Logout', icon: LogoutIcon }), []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 px-4 py-6 text-slate-900">
      <div className="aspect-[16/9] w-full max-w-[1700px] overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_18px_42px_rgba(28,63,99,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl">
        <div className="relative flex h-full w-full bg-gradient-to-br from-sky-50 via-white to-blue-50">
          <div className="relative flex h-full flex-1 flex-col px-6 py-8 lg:px-10">
            <div className="mx-auto flex w-full max-w-[1700px] flex-1 gap-6">
              <main className="flex-1 space-y-6">
                <header className="flex items-start justify-between rounded-[26px] border border-slate-100 bg-slate-50/80 p-4 shadow-sm backdrop-blur">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">Assistant Panel</h1>
                  </div>
              <div className="grid grid-cols-5 gap-3 text-center text-xs font-semibold text-slate-700">
                <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                  <p className="text-slate-500">Total</p>
                  <p className="text-xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                  <p className="text-slate-500">Male</p>
                  <p className="text-xl font-bold text-slate-900">{stats.male}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                  <p className="text-slate-500">Female</p>
                  <p className="text-xl font-bold text-slate-900">{stats.female}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                  <p className="text-slate-500">Existing</p>
                  <p className="text-xl font-bold text-slate-900">{stats.existing}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                  <p className="text-slate-500">New</p>
                  <p className="text-xl font-bold text-slate-900">{stats.new}</p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_1.6fr_1fr]">
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Add Patient to System</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                Pre-registration
              </span>
            </div>
            <div className="space-y-3 text-sm text-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                  placeholder="Enter Patient NIC"
                  value={formState.nic}
                  onChange={(e) => setFormState((p) => ({ ...p, nic: e.target.value }))}
                />
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                  placeholder="Patient Name"
                  value={formState.name}
                  onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                />
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                  placeholder="Mobile Number"
                  value={formState.mobile}
                  onChange={(e) => setFormState((p) => ({ ...p, mobile: e.target.value }))}
                />
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                  placeholder="Age"
                  value={formState.age}
                  onChange={(e) => setFormState((p) => ({ ...p, age: e.target.value.replace(/[^0-9]/g, '') }))}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {formState.allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-100"
                  >
                    {allergy}
                    <button
                      type="button"
                      className="rounded-full bg-white px-2 text-rose-600 ring-1 ring-rose-100"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          allergies: prev.allergies.filter((entry) => entry !== allergy),
                        }))
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                  <input
                    className="bg-transparent text-xs outline-none"
                    placeholder="Add allergies"
                    value={formState.allergyInput}
                    onChange={(e) => setFormState((p) => ({ ...p, allergyInput: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAllergy();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-[11px] font-semibold text-white shadow-[0_10px_22px_rgba(0,114,206,0.22)]"
                    onClick={addAllergy}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                  Blood Group
                  {['A+', 'A-', 'B+', 'O+', 'AB+'].map((group) => (
                    <button
                      key={group}
                      type="button"
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        formState.bloodGroup === group
                          ? 'bg-[var(--ioc-blue)] text-white shadow-[0_10px_22px_rgba(0,114,206,0.22)]'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                      onClick={() => setFormState((p) => ({ ...p, bloodGroup: group }))}
                    >
                      {group}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                  Priority Level
                  {['Normal', 'Urgent', 'Critical'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`rounded-full px-3 py-1 ${
                        formState.priority === level ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700'
                      }`}
                      onClick={() => setFormState((p) => ({ ...p, priority: level as typeof p.priority }))}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                  Add regular Drugs
                  <input
                    className="w-32 rounded-full bg-slate-100 px-3 py-1 text-xs outline-none"
                    placeholder="eg: Aspirin"
                    value={formState.regularDrug}
                    onChange={(e) => setFormState((p) => ({ ...p, regularDrug: e.target.value }))}
                  />
                  <button type="button" className="rounded-full bg-emerald-500 px-3 py-1 text-white">
                    Done
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addPatient}
                  className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600"
                >
                  Confirm
                </button>
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Doctor Checked Patient</h2>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">03</span>
                <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 font-semibold text-white shadow-[0_10px_22px_rgba(0,114,206,0.22)]">Patient</span>
              </div>
            </div>
            {activePrescription ? (
              <div className="space-y-4 text-sm text-slate-800">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 shadow-inner">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-white">Patient No</span>
                      <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-white">{activePrescription.id}</span>
                    </div>
                    <span className="rounded-full bg-lime-100 px-3 py-1 font-semibold text-lime-700">Bill paid</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[13px] font-semibold text-slate-500">Patient Name</p>
                      <p className="text-lg font-semibold text-slate-900">{activePrescription.patient}</p>
                      <p className="text-xs text-slate-500">NIC {activePrescription.nic}</p>
                    </div>
                    <div className="flex items-end justify-end gap-3 text-sm font-semibold text-slate-700">
                      <span className="rounded-full bg-[var(--ioc-blue)] px-4 py-2 text-white">Age {activePrescription.age}</span>
                      <span className={`rounded-full px-4 py-2 ${
                        activePrescription.gender === 'Female'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {activePrescription.gender}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-2 text-white">Disease</span>
                    <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-2 text-white">{activePrescription.diagnosis}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-2 text-xs font-semibold text-white">Allergies</span>
                    {activePrescription.allergies.map((allergy) => (
                      <span key={allergy} className="rounded-full bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
                  <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-white">Clinical Drugs</span>
                      <span className="rounded-full bg-lime-100 px-3 py-1 text-lime-700">Given</span>
                    </div>
                    <div className="space-y-2">
                      {activePrescription.clinical.map((drug) => (
                        <div key={drug.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                          <div>
                            <p className="text-slate-900">{drug.name}</p>
                            <p className="text-[11px] text-slate-500">{drug.dose} · {drug.terms}</p>
                          </div>
                          <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-white">{drug.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-white">Outside Drugs</span>
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">Pending</span>
                    </div>
                    <div className="space-y-2">
                      {activePrescription.outside.map((drug) => (
                        <div key={drug.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                          <div>
                            <p className="text-slate-900">{drug.name}</p>
                            <p className="text-[11px] text-slate-500">{drug.dose} · {drug.terms}</p>
                          </div>
                          <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-white">{drug.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-inner">
                  <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-2 text-white">Follow-up Summary</span>
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-700">Reviewed with patient</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-3">
                    <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-2 text-white">Medical Tests</span>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Clear</span>
                      </div>
                      <p className="leading-relaxed">No tests were requested during this visit.</p>
                    </div>

                    <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-2 text-white">Notes</span>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">None</span>
                      </div>
                      <p className="leading-relaxed">No additional notes were recorded by the doctor.</p>
                    </div>

                    <div className="flex flex-col gap-2 rounded-xl bg-[var(--ioc-blue)] p-3 text-white ring-1 ring-[rgba(0,114,206,0.65)] shadow-[0_16px_32px_rgba(0,114,206,0.26)]">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="rounded-full bg-white/15 px-3 py-2">Next Visit</span>
                        <span className="rounded-full bg-white/15 px-3 py-1">Confirmed</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="text-4xl font-bold leading-none">05</div>
                        <div className="leading-tight">
                          <div className="text-sm font-semibold">November</div>
                          <div className="text-xs font-medium text-slate-200">2025</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-200">Please confirm the appointment with the patient before discharge.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-2 text-white">Download</span>
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-400 line-through">Medical report locked</span>
                  </div>
                  <button
                    type="button"
                    className="rounded-2xl bg-[var(--ioc-blue)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,114,206,0.24)] transition hover:-translate-y-0.5"
                    onClick={markDoneAndNext}
                  >
                    Done & Next
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No prescriptions waiting for pickup.</p>
            )}
          </Panel>

          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Available Doctors Today</h2>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Live</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableDoctors.map((doc) => (
                <span
                  key={doc.name}
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${
                    doc.status === 'Online'
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {doc.name}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between text-sm font-semibold text-slate-900">
              <span>Completed Patient List</span>
              <input
                className="rounded-full border border-slate-200 px-3 py-2 text-xs shadow-inner"
                placeholder="Search patient"
                value={completedSearch}
                onChange={(e) => setCompletedSearch(e.target.value)}
              />
            </div>
            <div className="mt-3 space-y-2">
              {filteredCompleted.map((entry) => (
                <div
                  key={entry.nic}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-700"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{entry.name}</p>
                    <p className="text-[11px] text-slate-500">NIC {entry.nic}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-white">Age {entry.age}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{entry.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
            </div>
      </main>
    </div>
  </div>

    <aside className="sticky top-0 flex h-screen w-28 flex-col items-center justify-between bg-transparent py-10">
    <div className="flex flex-col items-center gap-5">
      <div className="flex size-20 items-center justify-center rounded-full bg-[var(--ioc-blue)] text-white shadow-[0_25px_40px_rgba(0,114,206,0.35)]">
        <AssistantIcon className="size-9" />
      </div>
      <div className="h-10 w-px rounded-full bg-slate-200" />
      <div className="flex flex-col items-center rounded-[999px] border border-sky-100 bg-[rgba(0,114,206,0.08)] px-3 py-6 text-slate-600 shadow-[0_25px_45px_rgba(0,114,206,0.12)] backdrop-blur">
        <ul className="flex flex-col items-center gap-4">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`ios-nav-button group relative flex items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ioc-blue)] ${
                  item.id === activeNavigationId
                    ? 'size-14 bg-[var(--ioc-blue)] text-white shadow-[0_18px_32px_rgba(0,114,206,0.28)]'
                    : 'size-12 bg-white text-slate-500 ring-1 ring-sky-100 hover:ring-sky-200'
                }`}
                aria-label={item.label}
                aria-current={item.id === activeNavigationId ? 'page' : undefined}
              >
                <item.icon className="size-5" />
                <span className={`pointer-events-none absolute right-full mr-3 origin-right scale-90 rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-xs font-medium uppercase tracking-wide text-white opacity-0 ${SHADOWS.tooltip} transition group-hover:scale-100 group-hover:opacity-100`}>
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="h-10 w-px rounded-full bg-slate-200" />
    </div>

    <Link
      href="/logout"
      className="ios-nav-button group relative flex size-14 items-center justify-center rounded-full border border-rose-100 bg-white text-rose-500 shadow-[0_12px_24px_rgba(244,63,94,0.25)] transition hover:-translate-y-0.5 hover:border-rose-200"
      aria-label={logoutItem.label}
    >
      <logoutItem.icon className="size-5" />
      <span className={`pointer-events-none absolute right-full mr-3 origin-right scale-90 rounded-full bg-rose-600 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white opacity-0 ${SHADOWS.tooltip} transition group-hover:scale-100 group-hover:opacity-100`}>
        {logoutItem.label}
      </span>
    </Link>
  </aside>
        </div>
      </div>
    </main>
  );
}
